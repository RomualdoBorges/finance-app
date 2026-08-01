import type {
  CreatableTransactionStatus,
  PersistedTransactionStatus,
} from './transactionStatus'

export const TRANSACTION_TYPES = ['income', 'expense'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]
export const TRANSACTION_OPERATION_KINDS = [
  'normal',
  'reversal',
  'refund',
] as const
export type TransactionOperationKind =
  (typeof TRANSACTION_OPERATION_KINDS)[number]

export const TRANSACTION_TYPE_LABELS: Readonly<
  Record<TransactionType, string>
> = {
  income: 'Receita',
  expense: 'Despesa',
}

export type Transaction = {
  readonly id: string
  readonly groupId: string
  readonly type: TransactionType
  readonly description: string
  readonly normalizedDescription: string
  readonly amountMinor: number
  readonly accountId: string
  readonly categoryId: string
  readonly notes: string | null
  readonly status: PersistedTransactionStatus
  readonly competenceDate: string | null
  readonly dueDate: string | null
  readonly paymentDate: string | null
  readonly createdBy: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly operationKind: TransactionOperationKind
  readonly confirmedAt: Date | null
  readonly confirmedBy: string | null
  readonly canceledAt: Date | null
  readonly canceledBy: string | null
  readonly cancellationReason: string | null
  readonly reversalOfTransactionId: string | null
  readonly refundOfTransactionId: string | null
  readonly reversedByTransactionId: string | null
  readonly refundedByTransactionId: string | null
}

export type CreateTransactionInput = Pick<
  Transaction,
  'type' | 'description' | 'amountMinor' | 'accountId' | 'categoryId' | 'notes'
> & {
  readonly status: CreatableTransactionStatus
  readonly competenceDate: string
  readonly dueDate: string
  readonly paymentDate: string
}

export type PersistTransactionInput = Omit<
  Transaction,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'competenceDate'
  | 'dueDate'
  | 'paymentDate'
> & {
  readonly competenceDate: string
  readonly dueDate: string
  readonly paymentDate: string
}

export type UpdateTransactionInput = Omit<CreateTransactionInput, 'status'>
export type OppositeTransactionInput = {
  readonly categoryId: string
  readonly accountId: string
  readonly notes: string | null
}
