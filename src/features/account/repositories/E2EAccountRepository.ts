import type {
  Account,
  PersistAccountInput,
  PersistAccountUpdate,
} from '../domain/Account'
import type { AccountRepository } from './AccountRepository'

export class E2EAccountRepository implements AccountRepository {
  private readonly storageKey = 'finance-app:e2e-accounts'
  private readonly accounts = this.load()
  private nextId = this.accounts.size + 1

  private load(): Map<string, Account> {
    const raw = window.localStorage.getItem(this.storageKey)
    if (raw === null) return new Map()
    try {
      const accounts = JSON.parse(raw) as Array<
        Omit<Account, 'createdAt' | 'updatedAt'> & {
          createdAt: string
          updatedAt: string
        }
      >
      return new Map(
        accounts.map((account) => {
          const parsed: Account = {
            ...account,
            createdAt: new Date(account.createdAt),
            updatedAt: new Date(account.updatedAt),
          }
          return [`${parsed.groupId}:${parsed.id}`, parsed]
        }),
      )
    } catch {
      return new Map()
    }
  }

  private persist(): void {
    window.localStorage.setItem(
      this.storageKey,
      JSON.stringify([...this.accounts.values()]),
    )
  }

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
    this.persist()
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
    this.persist()
    return Promise.resolve(account)
  }
  setArchived(
    groupId: string,
    accountId: string,
    archived: boolean,
  ): Promise<void> {
    const key = `${groupId}:${accountId}`
    const current = this.accounts.get(key)
    if (current !== undefined) {
      this.accounts.set(key, {
        ...current,
        status: archived ? 'archived' : 'active',
        isArchived: archived,
        updatedAt: new Date(),
      })
      this.persist()
    }
    return Promise.resolve()
  }
}
