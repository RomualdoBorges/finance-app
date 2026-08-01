import { isValidCivilDate } from '../../../lib/date'

export const PERSISTED_TRANSACTION_STATUSES = [
  'planned',
  'pending',
  'confirmed',
  'canceled',
] as const
export type PersistedTransactionStatus =
  (typeof PERSISTED_TRANSACTION_STATUSES)[number]

export const CREATABLE_TRANSACTION_STATUSES = [
  'planned',
  'pending',
  'confirmed',
] as const
export type CreatableTransactionStatus =
  (typeof CREATABLE_TRANSACTION_STATUSES)[number]

export const TRANSACTION_DISPLAY_STATUSES = [
  ...PERSISTED_TRANSACTION_STATUSES,
  'overdue',
] as const
export type TransactionDisplayStatus =
  (typeof TRANSACTION_DISPLAY_STATUSES)[number]

export const DEFAULT_TRANSACTION_STATUS: CreatableTransactionStatus = 'pending'

export const TRANSACTION_STATUS_LABELS: Readonly<
  Record<TransactionDisplayStatus, string>
> = {
  planned: 'Planejado',
  pending: 'Pendente',
  confirmed: 'Confirmado',
  overdue: 'Vencido',
  canceled: 'Cancelado',
}

type StatusCandidate = {
  readonly status: PersistedTransactionStatus
  readonly dueDate: string | null
}

function assertCivilDate(value: string): void {
  if (!isValidCivilDate(value)) throw new TypeError('Data civil inválida.')
}

export function isTransactionOverdue(
  transaction: StatusCandidate,
  today: string,
): boolean {
  assertCivilDate(today)
  if (transaction.status !== 'pending' || transaction.dueDate === null)
    return false
  assertCivilDate(transaction.dueDate)
  return transaction.dueDate < today
}

export function getTransactionDisplayStatus(
  transaction: StatusCandidate,
  today: string,
): TransactionDisplayStatus {
  return isTransactionOverdue(transaction, today)
    ? 'overdue'
    : transaction.status
}

export function getTransactionStatusLabel(
  status: TransactionDisplayStatus,
): string {
  return TRANSACTION_STATUS_LABELS[status]
}
