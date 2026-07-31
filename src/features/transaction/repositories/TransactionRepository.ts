import type {
  PersistTransactionInput,
  Transaction,
} from '../domain/Transaction'

export interface TransactionRepository {
  create(input: PersistTransactionInput): Promise<Transaction>
  listRecentByGroup(groupId: string): Promise<readonly Transaction[]>
}
