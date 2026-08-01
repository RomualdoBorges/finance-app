import type {
  PersistTransactionInput,
  Transaction,
  UpdateTransactionInput,
  OppositeTransactionInput,
} from '../domain/Transaction'
import type { TransactionRepository } from './TransactionRepository'
import { RECENT_TRANSACTION_LIMIT } from './FirestoreTransactionRepository'
import {
  DEFAULT_TRANSACTION_STATUS,
  PERSISTED_TRANSACTION_STATUSES,
} from '../domain/transactionStatus'

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
        status:
          item.status === undefined
            ? DEFAULT_TRANSACTION_STATUS
            : (PERSISTED_TRANSACTION_STATUSES.find(
                (status) => status === item.status,
              ) ??
              (() => {
                throw new TypeError('Status inválido.')
              })()),
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
  private find(groupId: string, id: string) {
    const item = this.transactions.find(
      (value) => value.groupId === groupId && value.id === id,
    )
    if (!item) throw new Error('Lançamento não encontrado.')
    return item
  }
  update(
    groupId: string,
    id: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    const current = this.find(groupId, id)
    if (
      current.operationKind !== 'normal' ||
      !['planned', 'pending'].includes(current.status)
    )
      throw new Error('Operação não permitida.')
    Object.assign(current, input, { updatedAt: new Date() })
    this.persist()
    return Promise.resolve(current)
  }
  confirm(groupId: string, id: string, userId: string): Promise<Transaction> {
    const current = this.find(groupId, id)
    if (current.status === 'confirmed') return Promise.resolve(current)
    if (current.operationKind !== 'normal' || current.status === 'canceled')
      throw new Error('Operação não permitida.')
    Object.assign(current, {
      status: 'confirmed',
      confirmedAt: new Date(),
      confirmedBy: userId,
      updatedAt: new Date(),
    })
    this.persist()
    return Promise.resolve(current)
  }
  cancel(
    groupId: string,
    id: string,
    userId: string,
    reason: string,
  ): Promise<Transaction> {
    const current = this.find(groupId, id)
    if (current.status === 'canceled') return Promise.resolve(current)
    if (
      current.operationKind !== 'normal' ||
      current.reversedByTransactionId ||
      current.refundedByTransactionId
    )
      throw new Error('Operação não permitida.')
    Object.assign(current, {
      status: 'canceled',
      canceledAt: new Date(),
      canceledBy: userId,
      cancellationReason: reason,
      updatedAt: new Date(),
    })
    this.persist()
    return Promise.resolve(current)
  }
  createReversal(
    groupId: string,
    id: string,
    userId: string,
    input: OppositeTransactionInput,
  ) {
    return this.opposite('reversal', groupId, id, userId, input)
  }
  createRefund(
    groupId: string,
    id: string,
    userId: string,
    input: OppositeTransactionInput,
  ) {
    return this.opposite('refund', groupId, id, userId, input)
  }
  private opposite(
    kind: 'reversal' | 'refund',
    groupId: string,
    id: string,
    userId: string,
    input: OppositeTransactionInput,
  ): Promise<Transaction> {
    const original = this.find(groupId, id)
    const marker =
      kind === 'reversal'
        ? 'reversedByTransactionId'
        : 'refundedByTransactionId'
    if (
      original.status !== 'confirmed' ||
      original.operationKind !== 'normal' ||
      original[marker]
    )
      throw new Error('Operação não permitida.')
    const now = new Date()
    const newId = `transaction-${crypto.randomUUID()}`
    const item: Transaction = {
      ...original,
      ...input,
      id: newId,
      type: original.type === 'income' ? 'expense' : 'income',
      description: `${kind === 'reversal' ? 'Estorno' : 'Reembolso'} de ${original.description}`,
      operationKind: kind,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      confirmedAt: now,
      confirmedBy: userId,
      canceledAt: null,
      canceledBy: null,
      cancellationReason: null,
      reversalOfTransactionId: kind === 'reversal' ? id : null,
      refundOfTransactionId: kind === 'refund' ? id : null,
      reversedByTransactionId: null,
      refundedByTransactionId: null,
    }
    Object.assign(original, { [marker]: newId, updatedAt: now })
    this.transactions.push(item)
    this.persist()
    return Promise.resolve(item)
  }
}
