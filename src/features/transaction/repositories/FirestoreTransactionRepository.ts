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
  runTransaction,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Query,
} from 'firebase/firestore'
import {
  TRANSACTION_OPERATION_KINDS,
  type OppositeTransactionInput,
  type PersistTransactionInput,
  type Transaction,
  type TransactionType,
  type UpdateTransactionInput,
} from '../domain/Transaction'
import {
  DEFAULT_TRANSACTION_STATUS,
  PERSISTED_TRANSACTION_STATUSES,
} from '../domain/transactionStatus'
import {
  TransactionError,
  type TransactionErrorCode,
} from '../domain/TransactionError'
import {
  civilDateSchema,
  createTransactionSchema,
} from '../domain/transactionSchemas'
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
  const optionalDate = (field: string): Date | null => {
    if (!(field in data) || data[field] === null) return null
    const result = date(data[field])
    if (result === null) throw new TransactionError('invalid-data')
    return result
  }
  const optionalString = (field: string): string | null => {
    if (!(field in data) || data[field] === null) return null
    if (typeof data[field] !== 'string')
      throw new TransactionError('invalid-data')
    return data[field]
  }
  const parsed = createTransactionSchema
    .omit({
      competenceDate: true,
      dueDate: true,
      paymentDate: true,
      status: true,
    })
    .safeParse({
      type: data['type'],
      description: data['description'],
      amountMinor: data['amountMinor'],
      accountId: data['accountId'],
      categoryId: data['categoryId'],
      notes: data['notes'],
    })
  const legacyDate = (field: string): string | null => {
    if (!(field in data)) return null
    const result = civilDateSchema.safeParse(data[field])
    if (!result.success) throw new TransactionError('invalid-data')
    return result.data
  }
  const rawStatus = data['status']
  const status =
    rawStatus === undefined
      ? DEFAULT_TRANSACTION_STATUS
      : PERSISTED_TRANSACTION_STATUSES.find((item) => item === rawStatus)
  if (status === undefined) throw new TransactionError('invalid-data')
  const operationKind =
    data['operationKind'] === undefined
      ? 'normal'
      : TRANSACTION_OPERATION_KINDS.find(
          (item) => item === data['operationKind'],
        )
  if (operationKind === undefined) throw new TransactionError('invalid-data')
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
    status,
    competenceDate: legacyDate('competenceDate'),
    dueDate: legacyDate('dueDate'),
    paymentDate: legacyDate('paymentDate'),
    createdAt,
    updatedAt,
    operationKind,
    confirmedAt: optionalDate('confirmedAt'),
    confirmedBy: optionalString('confirmedBy'),
    canceledAt: optionalDate('canceledAt'),
    canceledBy: optionalString('canceledBy'),
    cancellationReason: optionalString('cancellationReason'),
    reversalOfTransactionId: optionalString('reversalOfTransactionId'),
    refundOfTransactionId: optionalString('refundOfTransactionId'),
    reversedByTransactionId: optionalString('reversedByTransactionId'),
    refundedByTransactionId: optionalString('refundedByTransactionId'),
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
        confirmedAt: input.status === 'confirmed' ? timestamp : null,
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
  private reference(groupId: string, transactionId: string) {
    return doc(
      this.firestore,
      'financialGroups',
      groupId,
      'transactions',
      transactionId,
    )
  }
  async update(
    groupId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    return this.mutate(groupId, transactionId, (current, transaction) => {
      if (
        current.operationKind !== 'normal' ||
        !['planned', 'pending'].includes(current.status)
      )
        throw new TransactionError('operation-not-allowed')
      transaction.update(this.reference(groupId, transactionId), {
        ...input,
        normalizedDescription: input.description
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleLowerCase('pt-BR')
          .trim(),
        updatedAt: serverTimestamp(),
      })
    })
  }
  async confirm(
    groupId: string,
    transactionId: string,
    userId: string,
  ): Promise<Transaction> {
    return this.mutate(groupId, transactionId, (current, transaction) => {
      if (current.operationKind !== 'normal')
        throw new TransactionError('operation-not-allowed')
      if (current.status === 'confirmed') return
      if (current.status === 'canceled')
        throw new TransactionError('transaction-canceled')
      transaction.update(this.reference(groupId, transactionId), {
        status: 'confirmed',
        confirmedAt: serverTimestamp(),
        confirmedBy: userId,
        updatedAt: serverTimestamp(),
      })
    })
  }
  async cancel(
    groupId: string,
    transactionId: string,
    userId: string,
    reason: string,
  ): Promise<Transaction> {
    return this.mutate(groupId, transactionId, (current, transaction) => {
      if (current.operationKind !== 'normal')
        throw new TransactionError('operation-not-allowed')
      if (current.status === 'canceled') return
      if (current.reversedByTransactionId || current.refundedByTransactionId)
        throw new TransactionError('operation-not-allowed')
      transaction.update(this.reference(groupId, transactionId), {
        status: 'canceled',
        canceledAt: serverTimestamp(),
        canceledBy: userId,
        cancellationReason: reason,
        updatedAt: serverTimestamp(),
      })
    })
  }
  createReversal(
    groupId: string,
    transactionId: string,
    userId: string,
    input: OppositeTransactionInput,
  ) {
    return this.createOpposite(
      'reversal',
      groupId,
      transactionId,
      userId,
      input,
    )
  }
  createRefund(
    groupId: string,
    transactionId: string,
    userId: string,
    input: OppositeTransactionInput,
  ) {
    return this.createOpposite('refund', groupId, transactionId, userId, input)
  }
  private async mutate(
    groupId: string,
    transactionId: string,
    action: (
      current: Transaction,
      transaction: Parameters<Parameters<typeof runTransaction>[1]>[0],
    ) => void,
  ): Promise<Transaction> {
    identifier(groupId)
    identifier(transactionId)
    try {
      await runTransaction(this.firestore, async (transaction) => {
        const reference = this.reference(groupId, transactionId)
        const snapshot = await transaction.get(reference)
        const current = mapTransactionSnapshot(groupId, {
          id: transactionId,
          exists: snapshot.exists(),
          data: snapshot.data(),
        })
        if (current === null)
          throw new TransactionError('transaction-not-found')
        action(current, transaction)
      })
      const snapshot = await getDoc(this.reference(groupId, transactionId))
      const result = mapTransactionSnapshot(groupId, {
        id: transactionId,
        exists: snapshot.exists(),
        data: snapshot.data(),
      })
      if (result === null) throw new TransactionError('transaction-not-found')
      return result
    } catch (error) {
      throw mapError(error)
    }
  }
  private async createOpposite(
    kind: 'reversal' | 'refund',
    groupId: string,
    transactionId: string,
    userId: string,
    input: OppositeTransactionInput,
  ): Promise<Transaction> {
    const generated = this.ops.newReference(this.firestore, groupId)
    await runTransaction(this.firestore, async (transaction) => {
      const originalRef = this.reference(groupId, transactionId)
      const snap = await transaction.get(originalRef)
      const original = mapTransactionSnapshot(groupId, {
        id: transactionId,
        exists: snap.exists(),
        data: snap.data(),
      })
      if (original === null) throw new TransactionError('transaction-not-found')
      if (
        original.operationKind !== 'normal' ||
        original.status !== 'confirmed'
      )
        throw new TransactionError('operation-not-allowed')
      const marker =
        kind === 'reversal'
          ? 'reversedByTransactionId'
          : 'refundedByTransactionId'
      if (original[marker])
        throw new TransactionError(
          kind === 'reversal' ? 'reversal-exists' : 'refund-exists',
        )
      const timestamp = serverTimestamp()
      transaction.set(generated.reference as DocumentReference<DocumentData>, {
        groupId,
        type: original.type === 'income' ? 'expense' : 'income',
        description: `${kind === 'reversal' ? 'Estorno' : 'Reembolso'} de ${original.description}`,
        normalizedDescription: `${kind === 'reversal' ? 'estorno' : 'reembolso'} de ${original.normalizedDescription}`,
        amountMinor: original.amountMinor,
        accountId: input.accountId,
        categoryId: input.categoryId,
        notes: input.notes,
        competenceDate: original.competenceDate,
        dueDate: original.dueDate,
        paymentDate: original.paymentDate,
        status: 'confirmed',
        operationKind: kind,
        confirmedAt: timestamp,
        confirmedBy: userId,
        canceledAt: null,
        canceledBy: null,
        cancellationReason: null,
        reversalOfTransactionId: kind === 'reversal' ? transactionId : null,
        refundOfTransactionId: kind === 'refund' ? transactionId : null,
        reversedByTransactionId: null,
        refundedByTransactionId: null,
        createdBy: userId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      transaction.update(originalRef, {
        [marker]: generated.id,
        updatedAt: timestamp,
      })
    })
    const result = mapTransactionSnapshot(
      groupId,
      await this.ops.get(generated.reference),
    )
    if (result === null) throw new TransactionError('invalid-data')
    return result
  }
}
