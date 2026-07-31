import type { z } from 'zod'
import type { AccountRepository } from '../../account/repositories/AccountRepository'
import type { CategoryRepository } from '../../category/repositories/CategoryRepository'
import type { CreateTransactionInput, Transaction } from '../domain/Transaction'
import { TransactionError } from '../domain/TransactionError'
import { normalizeTransactionDescription } from '../domain/normalizeTransactionDescription'
import {
  createTransactionSchema,
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
    })
  }
}
