import type { z } from 'zod'
import type { AccountRepository } from '../../account/repositories/AccountRepository'
import type { CategoryRepository } from '../../category/repositories/CategoryRepository'
import type {
  CreateTransactionInput,
  OppositeTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../domain/Transaction'
import { TransactionError } from '../domain/TransactionError'
import { normalizeTransactionDescription } from '../domain/normalizeTransactionDescription'
import {
  createTransactionSchema,
  updateTransactionSchema,
  cancelTransactionSchema,
  oppositeTransactionSchema,
  transactionIdentitySchema,
} from '../domain/transactionSchemas'
import type { TransactionRepository } from '../repositories/TransactionRepository'

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success)
    throw new TransactionError('invalid-input', { cause: result.error })
  return result.data
}

export class TransactionService {
  private readonly repository: TransactionRepository
  private readonly accountRepository: AccountRepository
  private readonly categoryRepository: CategoryRepository

  constructor(
    repository: TransactionRepository,
    accountRepository: AccountRepository,
    categoryRepository: CategoryRepository,
  ) {
    this.repository = repository
    this.accountRepository = accountRepository
    this.categoryRepository = categoryRepository
  }

  async listRecentByGroup(groupId: string): Promise<readonly Transaction[]> {
    const identity = parse(transactionIdentitySchema.pick({ groupId: true }), {
      groupId,
    })
    return this.repository.listRecentByGroup(identity.groupId)
  }

  async createTransaction(
    context: { readonly groupId: string; readonly userId: string },
    input: CreateTransactionInput,
  ): Promise<Transaction> {
    const identity = parse(transactionIdentitySchema, context)
    const values = parse(createTransactionSchema, input)
    const [accounts, category] = await Promise.all([
      this.accountRepository.listByGroup(identity.groupId),
      this.categoryRepository.getById(identity.groupId, values.categoryId),
    ])
    const account = accounts.find(({ id }) => id === values.accountId)
    if (account === undefined) throw new TransactionError('account-not-found')
    if (account.isArchived) throw new TransactionError('account-archived')
    if (category === null) throw new TransactionError('category-not-found')
    if (category.status === 'archived')
      throw new TransactionError('category-archived')
    if (category.type !== values.type)
      throw new TransactionError('category-type-mismatch')
    return this.repository.create({
      ...values,
      groupId: identity.groupId,
      normalizedDescription: normalizeTransactionDescription(
        values.description,
      ),
      createdBy: identity.userId,
      operationKind: 'normal',
      confirmedAt: values.status === 'confirmed' ? new Date() : null,
      confirmedBy: values.status === 'confirmed' ? identity.userId : null,
      canceledAt: null,
      canceledBy: null,
      cancellationReason: null,
      reversalOfTransactionId: null,
      refundOfTransactionId: null,
      reversedByTransactionId: null,
      refundedByTransactionId: null,
    })
  }
  async updateTransaction(
    context: { groupId: string; userId: string },
    transactionId: string,
    input: UpdateTransactionInput,
  ) {
    const identity = parse(transactionIdentitySchema, context)
    const values = parse(updateTransactionSchema, input)
    await this.validateReferences(
      identity.groupId,
      values.accountId,
      values.categoryId,
      values.type,
    )
    return this.repository.update(identity.groupId, transactionId, values)
  }
  confirmTransaction(
    context: { groupId: string; userId: string },
    transactionId: string,
  ) {
    const identity = parse(transactionIdentitySchema, context)
    return this.repository.confirm(
      identity.groupId,
      transactionId,
      identity.userId,
    )
  }
  cancelTransaction(
    context: { groupId: string; userId: string },
    transactionId: string,
    reason: string,
  ) {
    const identity = parse(transactionIdentitySchema, context)
    const values = parse(cancelTransactionSchema, {
      cancellationReason: reason,
    })
    return this.repository.cancel(
      identity.groupId,
      transactionId,
      identity.userId,
      values.cancellationReason,
    )
  }
  createReversal(
    context: { groupId: string; userId: string },
    transaction: Transaction,
    input: OppositeTransactionInput,
  ) {
    return this.createOpposite('reversal', context, transaction, input)
  }
  createRefund(
    context: { groupId: string; userId: string },
    transaction: Transaction,
    input: OppositeTransactionInput,
  ) {
    return this.createOpposite('refund', context, transaction, input)
  }
  private async createOpposite(
    kind: 'reversal' | 'refund',
    context: { groupId: string; userId: string },
    transaction: Transaction,
    input: OppositeTransactionInput,
  ) {
    const identity = parse(transactionIdentitySchema, context)
    const values = parse(oppositeTransactionSchema, input)
    if (values.accountId !== transaction.accountId)
      throw new TransactionError('invalid-input')
    const inverse = transaction.type === 'income' ? 'expense' : 'income'
    await this.validateReferences(
      identity.groupId,
      values.accountId,
      values.categoryId,
      inverse,
    )
    return kind === 'reversal'
      ? this.repository.createReversal(
          identity.groupId,
          transaction.id,
          identity.userId,
          values,
        )
      : this.repository.createRefund(
          identity.groupId,
          transaction.id,
          identity.userId,
          values,
        )
  }
  private async validateReferences(
    groupId: string,
    accountId: string,
    categoryId: string,
    type: 'income' | 'expense',
  ) {
    const [accounts, category] = await Promise.all([
      this.accountRepository.listByGroup(groupId),
      this.categoryRepository.getById(groupId, categoryId),
    ])
    const account = accounts.find((item) => item.id === accountId)
    if (!account) throw new TransactionError('account-not-found')
    if (account.isArchived) throw new TransactionError('account-archived')
    if (!category) throw new TransactionError('category-not-found')
    if (category.status === 'archived')
      throw new TransactionError('category-archived')
    if (category.type !== type)
      throw new TransactionError('category-type-mismatch')
  }
}
