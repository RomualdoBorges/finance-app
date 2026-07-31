import type {
  Account,
  PersistAccountInput,
  PersistAccountUpdate,
} from '../domain/Account'
import type { AccountRepository } from './AccountRepository'

export class E2EAccountRepository implements AccountRepository {
  private readonly accounts = new Map<string, Account>()
  private nextId = 1

  listByGroup(groupId: string): Promise<readonly Account[]> {
    return Promise.resolve(
      [...this.accounts.values()].filter(
        (account) => account.groupId === groupId,
      ),
    )
  }
  create(input: PersistAccountInput): Promise<Account> {
    const id = `account-${this.nextId++}`
    const timestamp = new Date()
    const account = { ...input, id, createdAt: timestamp, updatedAt: timestamp }
    this.accounts.set(`${input.groupId}:${id}`, account)
    return Promise.resolve(account)
  }
  update(
    groupId: string,
    accountId: string,
    input: PersistAccountUpdate,
  ): Promise<Account> {
    const key = `${groupId}:${accountId}`
    const current = this.accounts.get(key)
    if (current === undefined) return Promise.reject(new Error('not found'))
    const account = { ...current, ...input, updatedAt: new Date() }
    this.accounts.set(key, account)
    return Promise.resolve(account)
  }
  setArchived(
    groupId: string,
    accountId: string,
    archived: boolean,
  ): Promise<void> {
    const key = `${groupId}:${accountId}`
    const current = this.accounts.get(key)
    if (current !== undefined)
      this.accounts.set(key, {
        ...current,
        status: archived ? 'archived' : 'active',
        isArchived: archived,
        updatedAt: new Date(),
      })
    return Promise.resolve()
  }
}
