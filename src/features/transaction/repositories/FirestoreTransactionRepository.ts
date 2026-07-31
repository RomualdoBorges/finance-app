import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Query,
} from 'firebase/firestore'
import {
  type PersistTransactionInput,
  type Transaction,
  type TransactionType,
} from '../domain/Transaction'
import {
  TransactionError,
  type TransactionErrorCode,
} from '../domain/TransactionError'
import { createTransactionSchema } from '../domain/transactionSchemas'
import type { TransactionRepository } from './TransactionRepository'

export const RECENT_TRANSACTION_LIMIT = 50
type Snapshot = {
  readonly id: string
  readonly exists: boolean
  readonly data: unknown
}
export type FirestoreTransactionOperations = {
  readonly recentQuery: (firestore: Firestore, groupId: string) => unknown
  readonly newReference: (
    firestore: Firestore,
    groupId: string,
  ) => { readonly id: string; readonly reference: unknown }
  readonly get: (reference: unknown) => Promise<Snapshot>
  readonly list: (reference: unknown) => Promise<readonly Snapshot[]>
  readonly set: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<void>
  readonly serverTimestamp: () => unknown
}
const operations: FirestoreTransactionOperations = {
  recentQuery: (firestore, groupId) =>
    query(
      collection(firestore, 'financialGroups', groupId, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(RECENT_TRANSACTION_LIMIT),
    ),
  newReference: (firestore, groupId) => {
    const reference = doc(
      collection(firestore, 'financialGroups', groupId, 'transactions'),
    )
    return { id: reference.id, reference }
  },
  get: async (reference) => {
    const snapshot = await getDoc(reference as DocumentReference<DocumentData>)
    return {
      id: snapshot.id,
      exists: snapshot.exists(),
      data: snapshot.exists() ? snapshot.data() : undefined,
    }
  },
  list: async (reference) =>
    (await getDocs(reference as Query<DocumentData>)).docs.map((item) => ({
      id: item.id,
      exists: true,
      data: item.data(),
    })),
  set: (reference, data) =>
    setDoc(reference as DocumentReference<DocumentData>, data),
  serverTimestamp,
}
function date(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null || !('toDate' in value))
    return null
  const result = (value as { toDate?: () => unknown }).toDate?.()
  return result instanceof Date && !Number.isNaN(result.getTime())
    ? result
    : null
}
export function mapTransactionSnapshot(
  groupId: string,
  snapshot: Snapshot,
): Transaction | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null)
    throw new TransactionError('invalid-data')
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = date(data['createdAt'])
  const updatedAt = date(data['updatedAt'])
  const parsed = createTransactionSchema.safeParse({
    type: data['type'],
    description: data['description'],
    amountMinor: data['amountMinor'],
    accountId: data['accountId'],
    categoryId: data['categoryId'],
    notes: data['notes'],
  })
  if (
    snapshot.id.length === 0 ||
    data['groupId'] !== groupId ||
    !parsed.success ||
    typeof data['normalizedDescription'] !== 'string' ||
    typeof data['createdBy'] !== 'string' ||
    createdAt === null ||
    updatedAt === null
  )
    throw new TransactionError('invalid-data')
  return {
    id: snapshot.id,
    groupId,
    ...parsed.data,
    type: data['type'] as TransactionType,
    normalizedDescription: data['normalizedDescription'],
    createdBy: data['createdBy'],
    createdAt,
    updatedAt,
  }
}
function identifier(value: string): void {
  if (value.trim().length === 0 || value.includes('/'))
    throw new TransactionError('invalid-input')
}
function mapError(error: unknown): TransactionError {
  if (error instanceof TransactionError) return error
  const raw =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
  const codes: Readonly<Record<string, TransactionErrorCode>> = {
    'permission-denied': 'permission-denied',
    'firestore/permission-denied': 'permission-denied',
    unauthenticated: 'unauthenticated',
    'firestore/unauthenticated': 'unauthenticated',
    unavailable: 'unavailable',
    'firestore/unavailable': 'unavailable',
  }
  return new TransactionError(codes[raw] ?? 'unknown', { cause: error })
}
export class FirestoreTransactionRepository implements TransactionRepository {
  private readonly firestore: Firestore
  private readonly ops: FirestoreTransactionOperations

  constructor(
    firestore: Firestore,
    ops: FirestoreTransactionOperations = operations,
  ) {
    this.firestore = firestore
    this.ops = ops
  }
  async listRecentByGroup(groupId: string): Promise<readonly Transaction[]> {
    identifier(groupId)
    try {
      return (
        await this.ops.list(this.ops.recentQuery(this.firestore, groupId))
      ).map((snapshot) => {
        const item = mapTransactionSnapshot(groupId, snapshot)
        if (item === null) throw new TransactionError('invalid-data')
        return item
      })
    } catch (error) {
      throw mapError(error)
    }
  }
  async create(input: PersistTransactionInput): Promise<Transaction> {
    identifier(input.groupId)
    try {
      const generated = this.ops.newReference(this.firestore, input.groupId)
      const timestamp = this.ops.serverTimestamp()
      await this.ops.set(generated.reference, {
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      const item = mapTransactionSnapshot(
        input.groupId,
        await this.ops.get(generated.reference),
      )
      if (item === null) throw new TransactionError('invalid-data')
      return item
    } catch (error) {
      throw mapError(error)
    }
  }
}
