import type {
  PersistTransactionInput,
  Transaction,
  UpdateTransactionInput,
  OppositeTransactionInput,
} from '../domain/Transaction'

export interface TransactionRepository {
  create(input: PersistTransactionInput): Promise<Transaction>
  listRecentByGroup(groupId: string): Promise<readonly Transaction[]>
  update(
    groupId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction>
  confirm(
    groupId: string,
    transactionId: string,
    userId: string,
  ): Promise<Transaction>
  cancel(
    groupId: string,
    transactionId: string,
    userId: string,
    reason: string,
  ): Promise<Transaction>
  createReversal(
    groupId: string,
    transactionId: string,
    userId: string,
    input: OppositeTransactionInput,
  ): Promise<Transaction>
  createRefund(
    groupId: string,
    transactionId: string,
    userId: string,
    input: OppositeTransactionInput,
  ): Promise<Transaction>
}
