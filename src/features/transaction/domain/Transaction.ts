import type {
  CreatableTransactionStatus,
  PersistedTransactionStatus,
} from './transactionStatus'

export const TRANSACTION_TYPES = ['income', 'expense'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

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
