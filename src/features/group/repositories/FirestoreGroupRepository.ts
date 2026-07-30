import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'

import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../../user/domain/UserProfile'
import { mapUserProfileSnapshot } from '../../user/repositories/FirestoreUserRepository'
import {
  PERSONAL_GROUP_NAME,
  type Group,
  type GroupMember,
  type PersonalGroup,
} from '../domain/Group'
import { GroupError, type GroupErrorCode } from '../domain/GroupError'
import type { GroupRepository } from './GroupRepository'

type Snapshot = {
  readonly id: string
  readonly exists: boolean
  readonly data: unknown
}

type GroupTransaction = {
  readonly get: (reference: unknown) => Promise<Snapshot>
  readonly set: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => void
}

export type FirestoreGroupOperations = {
  readonly groupReference: (firestore: Firestore, groupId: string) => unknown
  readonly membershipReference: (
    firestore: Firestore,
    userId: string,
  ) => unknown
  readonly profileReference: (firestore: Firestore, userId: string) => unknown
  readonly getDocument: (reference: unknown) => Promise<Snapshot>
  readonly mergeDocument: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<void>
  readonly runTransaction: (
    firestore: Firestore,
    operation: (transaction: GroupTransaction) => Promise<void>,
  ) => Promise<void>
  readonly serverTimestamp: () => unknown
}

function snapshotFromFirebase(snapshot: {
  readonly id: string
  readonly exists: () => boolean
  readonly data: () => DocumentData | undefined
}): Snapshot {
  return {
    id: snapshot.id,
    exists: snapshot.exists(),
    data: snapshot.exists() ? snapshot.data() : undefined,
  }
}

const defaultOperations: FirestoreGroupOperations = {
  groupReference: (firestore, groupId) => doc(firestore, 'groups', groupId),
  membershipReference: (firestore, userId) =>
    doc(firestore, 'groupMembers', userId),
  profileReference: (firestore, userId) => doc(firestore, 'users', userId),
  getDocument: async (reference) =>
    snapshotFromFirebase(
      await getDoc(reference as DocumentReference<DocumentData>),
    ),
  mergeDocument: (reference, data) =>
    setDoc(reference as DocumentReference<DocumentData>, data, { merge: true }),
  runTransaction: (firestore, operation) =>
    runTransaction(firestore, (transaction: Transaction) =>
      operation({
        get: async (reference) =>
          snapshotFromFirebase(
            await transaction.get(reference as DocumentReference<DocumentData>),
          ),
        set: (reference, data) => {
          transaction.set(reference as DocumentReference<DocumentData>, data)
        },
      }),
    ),
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

export function mapGroupError(error: unknown): GroupError {
  if (error instanceof GroupError) return error

  const codes: Readonly<Record<string, GroupErrorCode>> = {
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
  return new GroupError(
    code === undefined ? 'unknown' : (codes[code] ?? 'unknown'),
  )
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null) return null
  const timestamp = value as { readonly toDate?: () => unknown }
  if (typeof timestamp.toDate !== 'function') return null
  const date = timestamp.toDate()
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
}

export function mapGroupSnapshot(snapshot: Snapshot): Group | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null) {
    throw new GroupError('invalid-data')
  }
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = toDate(data['createdAt'])
  const updatedAt = toDate(data['updatedAt'])
  if (
    snapshot.id.trim().length === 0 ||
    typeof data['name'] !== 'string' ||
    data['name'] !== PERSONAL_GROUP_NAME ||
    createdAt === null ||
    updatedAt === null
  ) {
    throw new GroupError('invalid-data')
  }
  return { id: snapshot.id, name: data['name'], createdAt, updatedAt }
}

export function mapMembershipSnapshot(snapshot: Snapshot): GroupMember | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null) {
    throw new GroupError('invalid-data')
  }
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = toDate(data['createdAt'])
  if (
    snapshot.id.trim().length === 0 ||
    typeof data['groupId'] !== 'string' ||
    typeof data['userId'] !== 'string' ||
    data['role'] !== 'OWNER' ||
    createdAt === null
  ) {
    throw new GroupError('invalid-data')
  }
  return {
    id: snapshot.id,
    groupId: data['groupId'],
    userId: data['userId'],
    role: data['role'],
    createdAt,
  }
}

function validateId(id: string): void {
  if (id.trim().length === 0 || id.includes('/')) {
    throw new GroupError('unauthenticated')
  }
}

export class FirestoreGroupRepository implements GroupRepository {
  private readonly firestore: Firestore
  private readonly operations: FirestoreGroupOperations

  constructor(
    firestore: Firestore,
    operations: FirestoreGroupOperations = defaultOperations,
  ) {
    this.firestore = firestore
    this.operations = operations
  }

  async getGroup(groupId: string): Promise<Group | null> {
    validateId(groupId)
    try {
      return mapGroupSnapshot(
        await this.operations.getDocument(
          this.operations.groupReference(this.firestore, groupId),
        ),
      )
    } catch (error) {
      throw mapGroupError(error)
    }
  }

  async getMembership(userId: string): Promise<GroupMember | null> {
    validateId(userId)
    try {
      return mapMembershipSnapshot(
        await this.operations.getDocument(
          this.operations.membershipReference(this.firestore, userId),
        ),
      )
    } catch (error) {
      throw mapGroupError(error)
    }
  }

  async ensureActiveGroup(
    userId: string,
    groupId: string,
  ): Promise<UserProfile> {
    validateId(userId)
    validateId(groupId)

    try {
      const profileReference = this.operations.profileReference(
        this.firestore,
        userId,
      )
      const profile = mapUserProfileSnapshot(
        await this.operations.getDocument(profileReference),
      )
      if (profile === null) throw new GroupError('not-found')
      if (profile.activeGroupId === groupId) return profile
      if (profile.activeGroupId !== null) {
        throw new GroupError('invalid-data')
      }

      await this.operations.mergeDocument(profileReference, {
        activeGroupId: groupId,
        updatedAt: this.operations.serverTimestamp(),
      })
      const updatedProfile = mapUserProfileSnapshot(
        await this.operations.getDocument(profileReference),
      )
      if (updatedProfile === null) throw new GroupError('not-found')
      return updatedProfile
    } catch (error) {
      throw mapGroupError(error)
    }
  }

  async getActiveGroup(userId: string): Promise<Group | null> {
    validateId(userId)

    try {
      const profile = mapUserProfileSnapshot(
        await this.operations.getDocument(
          this.operations.profileReference(this.firestore, userId),
        ),
      )
      if (profile?.activeGroupId === null || profile === null) return null
      return await this.getGroup(profile.activeGroupId)
    } catch (error) {
      throw mapGroupError(error)
    }
  }

  async ensurePersonalGroup(user: AuthenticatedUser): Promise<PersonalGroup> {
    validateId(user.uid)
    const groupReference = this.operations.groupReference(
      this.firestore,
      user.uid,
    )
    const membershipReference = this.operations.membershipReference(
      this.firestore,
      user.uid,
    )

    try {
      await this.operations.runTransaction(
        this.firestore,
        async (transaction) => {
          const groupSnapshot = await transaction.get(groupReference)
          const membershipSnapshot = await transaction.get(membershipReference)
          const timestamp =
            !groupSnapshot.exists || !membershipSnapshot.exists
              ? this.operations.serverTimestamp()
              : null

          if (!groupSnapshot.exists) {
            transaction.set(groupReference, {
              name: PERSONAL_GROUP_NAME,
              createdAt: timestamp,
              updatedAt: timestamp,
            })
          } else {
            mapGroupSnapshot(groupSnapshot)
          }

          if (!membershipSnapshot.exists) {
            transaction.set(membershipReference, {
              groupId: user.uid,
              userId: user.uid,
              role: 'OWNER',
              createdAt: timestamp,
            })
          } else {
            const membership = mapMembershipSnapshot(membershipSnapshot)
            if (
              membership?.groupId !== user.uid ||
              membership.userId !== user.uid
            ) {
              throw new GroupError('invalid-data')
            }
          }
        },
      )

      const [group, membership] = await Promise.all([
        this.getGroup(user.uid),
        this.getMembership(user.uid),
      ])
      if (group === null || membership === null) {
        throw new GroupError('not-found')
      }
      return { group, membership }
    } catch (error) {
      throw mapGroupError(error)
    }
  }
}
