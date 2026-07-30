import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'

import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../domain/UserProfile'
import {
  UserProfileError,
  type UserProfileErrorCode,
} from '../domain/UserProfileError'
import type { UserRepository } from './UserRepository'

type ProfileSnapshot = {
  readonly id: string
  readonly exists: boolean
  readonly data: unknown
}

type FirestoreUserOperations = {
  readonly profileReference: (firestore: Firestore, uid: string) => unknown
  readonly getProfile: (reference: unknown) => Promise<ProfileSnapshot>
  readonly mergeProfile: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<void>
  readonly serverTimestamp: () => unknown
}

const defaultOperations: FirestoreUserOperations = {
  profileReference: (firestore, uid) => doc(firestore, 'users', uid),
  getProfile: async (reference) => {
    const snapshot = await getDoc(reference as DocumentReference<DocumentData>)
    return {
      id: snapshot.id,
      exists: snapshot.exists(),
      data: snapshot.exists() ? snapshot.data() : undefined,
    }
  },
  mergeProfile: (reference, data) =>
    setDoc(reference as DocumentReference<DocumentData>, data, { merge: true }),
  serverTimestamp,
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : undefined
}

export function mapUserProfileError(error: unknown): UserProfileError {
  if (error instanceof UserProfileError) return error

  const codeMap: Readonly<Record<string, UserProfileErrorCode>> = {
    'permission-denied': 'permission-denied',
    'firestore/permission-denied': 'permission-denied',
    unavailable: 'unavailable',
    'firestore/unavailable': 'unavailable',
    unauthenticated: 'unauthenticated',
    'firestore/unauthenticated': 'unauthenticated',
    'not-found': 'not-found',
    'firestore/not-found': 'not-found',
  }
  const code = getErrorCode(error)
  return new UserProfileError(
    code === undefined ? 'unknown' : (codeMap[code] ?? 'unknown'),
  )
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const timestamp = value as { readonly toDate?: () => unknown }
  if (typeof timestamp.toDate !== 'function') return null

  const date = timestamp.toDate()
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
}

export function mapUserProfileSnapshot(
  snapshot: ProfileSnapshot,
): UserProfile | null {
  if (!snapshot.exists) return null

  const data = snapshot.data
  if (typeof data !== 'object' || data === null) {
    throw new UserProfileError('invalid-profile')
  }

  const values = data as Readonly<Record<string, unknown>>
  const email = values['email']
  const displayName = values['displayName']
  const photoURL = values['photoURL']
  const activeGroupId = values['activeGroupId'] ?? null
  const createdAt = toDate(values['createdAt'])
  const updatedAt = toDate(values['updatedAt'])

  if (
    snapshot.id.trim().length === 0 ||
    !isNullableString(email) ||
    !isNullableString(displayName) ||
    !isNullableString(photoURL) ||
    !isNullableString(activeGroupId) ||
    createdAt === null ||
    updatedAt === null
  ) {
    throw new UserProfileError('invalid-profile')
  }

  return {
    id: snapshot.id,
    email,
    displayName,
    photoURL,
    activeGroupId,
    createdAt,
    updatedAt,
  }
}

function validateUid(uid: string): void {
  if (uid.trim().length === 0 || uid.includes('/')) {
    throw new UserProfileError('unauthenticated')
  }
}

export class FirestoreUserRepository implements UserRepository {
  private readonly firestore: Firestore
  private readonly operations: FirestoreUserOperations

  constructor(
    firestore: Firestore,
    operations: FirestoreUserOperations = defaultOperations,
  ) {
    this.firestore = firestore
    this.operations = operations
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    validateUid(uid)

    try {
      const reference = this.operations.profileReference(this.firestore, uid)
      const snapshot = await this.operations.getProfile(reference)
      return mapUserProfileSnapshot(snapshot)
    } catch (error) {
      throw mapUserProfileError(error)
    }
  }

  async ensureUserProfile(user: AuthenticatedUser): Promise<UserProfile> {
    validateUid(user.uid)

    try {
      const reference = this.operations.profileReference(
        this.firestore,
        user.uid,
      )
      const initialSnapshot = await this.operations.getProfile(reference)
      const profile = mapUserProfileSnapshot(initialSnapshot)

      if (profile === null) {
        const timestamp = this.operations.serverTimestamp()
        await this.operations.mergeProfile(reference, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      } else {
        const changes: Record<string, unknown> = {}
        if (profile.email !== user.email) changes['email'] = user.email
        if (profile.displayName !== user.displayName) {
          changes['displayName'] = user.displayName
        }
        if (profile.photoURL !== user.photoURL) {
          changes['photoURL'] = user.photoURL
        }

        if (Object.keys(changes).length === 0) return profile

        changes['updatedAt'] = this.operations.serverTimestamp()
        await this.operations.mergeProfile(reference, changes)
      }

      const materializedSnapshot = await this.operations.getProfile(reference)
      const materializedProfile = mapUserProfileSnapshot(materializedSnapshot)
      if (materializedProfile === null) {
        throw new UserProfileError('not-found')
      }
      return materializedProfile
    } catch (error) {
      throw mapUserProfileError(error)
    }
  }

  async ensureActiveGroupId({
    userId,
    groupId,
  }: {
    readonly userId: string
    readonly groupId: string
  }): Promise<UserProfile> {
    validateUid(userId)
    validateUid(groupId)

    try {
      const reference = this.operations.profileReference(this.firestore, userId)
      const profile = mapUserProfileSnapshot(
        await this.operations.getProfile(reference),
      )
      if (profile === null) throw new UserProfileError('not-found')
      if (profile.activeGroupId === groupId) return profile
      if (profile.activeGroupId !== null) {
        throw new UserProfileError('invalid-profile')
      }

      await this.operations.mergeProfile(reference, {
        activeGroupId: groupId,
        updatedAt: this.operations.serverTimestamp(),
      })
      const updatedProfile = mapUserProfileSnapshot(
        await this.operations.getProfile(reference),
      )
      if (updatedProfile === null) throw new UserProfileError('not-found')
      return updatedProfile
    } catch (error) {
      throw mapUserProfileError(error)
    }
  }

  async getActiveGroupId(userId: string): Promise<string | null> {
    const profile = await this.getUserProfile(userId)
    return profile?.activeGroupId ?? null
  }
}
