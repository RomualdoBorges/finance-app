import type { z } from 'zod'

import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../domain/Account'
import { AccountError } from '../domain/AccountError'
import {
  accountActionSchema,
  accountIdentitySchema,
  createAccountSchema,
  updateAccountSchema,
} from '../domain/accountSchemas'
import { normalizeAccountName } from '../domain/normalizeAccountName'
import type { AccountRepository } from '../repositories/AccountRepository'

type AccountContext = { readonly groupId: string; readonly userId: string }

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success)
    throw new AccountError('invalid-input', { cause: result.error })
  return result.data
}

function find(accounts: readonly Account[], accountId: string): Account {
  const account = accounts.find(({ id }) => id === accountId)
  if (account === undefined) throw new AccountError('account-not-found')
  return account
}

function assertUnique(
  accounts: readonly Account[],
  normalizedName: string,
  excludedId?: string,
): void {
  if (
    accounts.some(
      (account) =>
        account.id !== excludedId &&
        !account.isArchived &&
        account.normalizedName === normalizedName,
    )
  )
    throw new AccountError('duplicate')
}

export class AccountService {
  private readonly repository: AccountRepository

  constructor(repository: AccountRepository) {
    this.repository = repository
  }

  async listByGroup(groupId: string): Promise<readonly Account[]> {
    const identity = parse(accountIdentitySchema.pick({ groupId: true }), {
      groupId,
    })
    const accounts = await this.repository.listByGroup(identity.groupId)
    return [...accounts].sort(
      (left, right) =>
        Number(left.isArchived) - Number(right.isArchived) ||
        left.name.localeCompare(right.name, 'pt-BR'),
    )
  }

  async createAccount(
    context: AccountContext,
    input: CreateAccountInput,
  ): Promise<Account> {
    const identity = parse(accountIdentitySchema, context)
    const values = parse(createAccountSchema, input)
    const accounts = await this.repository.listByGroup(identity.groupId)
    const normalizedName = normalizeAccountName(values.name)
    assertUnique(accounts, normalizedName)
    return this.repository.create({
      ...values,
      groupId: identity.groupId,
      normalizedName,
      status: 'active',
      isArchived: false,
      createdBy: identity.userId,
    })
  }

  async updateAccount(
    context: AccountContext,
    input: UpdateAccountInput,
  ): Promise<Account> {
    const identity = parse(accountIdentitySchema, context)
    const values = parse(updateAccountSchema, input)
    const accounts = await this.repository.listByGroup(identity.groupId)
    const current = find(accounts, values.accountId)
    const normalizedName = normalizeAccountName(values.name)
    if (!current.isArchived) assertUnique(accounts, normalizedName, current.id)
    return this.repository.update(identity.groupId, current.id, {
      name: values.name,
      normalizedName,
      description: values.description,
      institutionName: values.institutionName,
      icon: values.icon,
      color: values.color,
      accountType: values.accountType,
      includeInBalance: values.includeInBalance,
      includeInNetWorth: values.includeInNetWorth,
    })
  }

  async archiveAccount(
    context: AccountContext,
    input: { readonly accountId: string },
  ): Promise<void> {
    const identity = parse(accountIdentitySchema, context)
    const action = parse(accountActionSchema, input)
    const account = find(
      await this.repository.listByGroup(identity.groupId),
      action.accountId,
    )
    if (account.isArchived) return
    await this.repository.setArchived(identity.groupId, account.id, true)
  }

  async restoreAccount(
    context: AccountContext,
    input: { readonly accountId: string },
  ): Promise<void> {
    const identity = parse(accountIdentitySchema, context)
    const action = parse(accountActionSchema, input)
    const accounts = await this.repository.listByGroup(identity.groupId)
    const account = find(accounts, action.accountId)
    if (!account.isArchived) return
    assertUnique(accounts, account.normalizedName, account.id)
    await this.repository.setArchived(identity.groupId, account.id, false)
  }
}
