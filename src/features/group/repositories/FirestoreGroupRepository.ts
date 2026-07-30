import {
  doc,
  getDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'

import {
  ACTIVE_GROUP_STATUS,
  PERSONAL_GROUP_CURRENCY,
  PERSONAL_GROUP_NAME,
  PERSONAL_GROUP_TYPE,
  type FinancialGroup,
} from '../domain/Group'
import { GroupError, type GroupErrorCode } from '../domain/GroupError'
import type { GroupRepository } from './GroupRepository'

export type FirestoreSnapshot = {
  readonly id: string
  readonly exists: boolean
  readonly data: unknown
}

export type FirestoreGroupOperations = {
  readonly groupReference: (firestore: Firestore, groupId: string) => unknown
  readonly getDocument: (reference: unknown) => Promise<FirestoreSnapshot>
}

export function snapshotFromFirebase(snapshot: {
  readonly id: string
  readonly exists: () => boolean
  readonly data: () => DocumentData | undefined
}): FirestoreSnapshot {
  return {
    id: snapshot.id,
    exists: snapshot.exists(),
    data: snapshot.exists() ? snapshot.data() : undefined,
  }
}

const defaultOperations: FirestoreGroupOperations = {
  groupReference: (firestore, groupId) =>
    doc(firestore, 'financialGroups', groupId),
  getDocument: async (reference) =>
    snapshotFromFirebase(
      await getDoc(reference as DocumentReference<DocumentData>),
    ),
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

export function firestoreTimestampToDate(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null) return null
  const timestamp = value as { readonly toDate?: () => unknown }
  if (typeof timestamp.toDate !== 'function') return null
  const date = timestamp.toDate()
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
}

export function validateFirestoreId(id: string): void {
  if (id.trim().length === 0 || id.includes('/')) {
    throw new GroupError('unauthenticated')
  }
}

export function mapGroupSnapshot(
  snapshot: FirestoreSnapshot,
): FinancialGroup | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null) {
    throw new GroupError('invalid-data')
  }
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = firestoreTimestampToDate(data['createdAt'])
  const updatedAt = firestoreTimestampToDate(data['updatedAt'])
  if (
    snapshot.id.trim().length === 0 ||
    data['name'] !== PERSONAL_GROUP_NAME ||
    data['type'] !== PERSONAL_GROUP_TYPE ||
    data['currency'] !== PERSONAL_GROUP_CURRENCY ||
    typeof data['ownerId'] !== 'string' ||
    data['status'] !== ACTIVE_GROUP_STATUS ||
    createdAt === null ||
    updatedAt === null
  ) {
    throw new GroupError('invalid-data')
  }
  return {
    id: snapshot.id,
    name: data['name'],
    type: data['type'],
    currency: data['currency'],
    ownerId: data['ownerId'],
    status: data['status'],
    createdAt,
    updatedAt,
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

  async getGroupById(groupId: string): Promise<FinancialGroup | null> {
    validateFirestoreId(groupId)
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
}
