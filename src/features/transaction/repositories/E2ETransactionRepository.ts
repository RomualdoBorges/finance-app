import type {
  PersistTransactionInput,
  Transaction,
} from '../domain/Transaction'
import type { TransactionRepository } from './TransactionRepository'
import { RECENT_TRANSACTION_LIMIT } from './FirestoreTransactionRepository'

export class E2ETransactionRepository implements TransactionRepository {
  private readonly storageKey = 'finance-app:e2e-transactions'
  private transactions = this.load()
  private load(): Transaction[] {
    try {
      const raw = window.localStorage.getItem(this.storageKey)
      if (raw === null) return []
      return (
        JSON.parse(raw) as Array<
          Omit<Transaction, 'createdAt' | 'updatedAt'> & {
            createdAt: string
            updatedAt: string
          }
        >
      ).map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
    } catch {
      return []
    }
  }
  private persist(): void {
    window.localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.transactions),
    )
  }
  listRecentByGroup(groupId: string): Promise<readonly Transaction[]> {
    return Promise.resolve(
      this.transactions
        .filter((item) => item.groupId === groupId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, RECENT_TRANSACTION_LIMIT),
    )
  }
  create(input: PersistTransactionInput): Promise<Transaction> {
    const timestamp = new Date()
    const item: Transaction = {
      ...input,
      id: `transaction-${crypto.randomUUID()}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.transactions.push(item)
    this.persist()
    return Promise.resolve(item)
  }
}
