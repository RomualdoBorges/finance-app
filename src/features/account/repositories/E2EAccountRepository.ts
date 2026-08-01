import type {
  Account,
  PersistAccountInput,
  PersistAccountUpdate,
} from '../domain/Account'
import type { AccountRepository } from './AccountRepository'

type StoredAccount = Omit<
  Account,
  'currentBalanceMinor' | 'projectedBalanceMinor' | 'balancesUpdatedAt'
> &
  Partial<
    Pick<
      Account,
      'currentBalanceMinor' | 'projectedBalanceMinor' | 'balancesUpdatedAt'
    >
  >

function readAccount(account: StoredAccount): Account {
  const consolidatedKeyCount = [
    'currentBalanceMinor',
    'projectedBalanceMinor',
    'balancesUpdatedAt',
  ].filter((key) => key in account).length
  if (consolidatedKeyCount !== 0 && consolidatedKeyCount !== 3) {
    throw new Error('Invalid consolidated account balances')
  }
  return {
    ...account,
    currentBalanceMinor:
      account.currentBalanceMinor ?? account.initialBalanceMinor,
    projectedBalanceMinor:
      account.projectedBalanceMinor ?? account.initialBalanceMinor,
    balancesUpdatedAt: account.balancesUpdatedAt ?? null,
  }
}

export class E2EAccountRepository implements AccountRepository {
  private readonly storageKey = 'finance-app:e2e-accounts'
  private readonly accounts = this.load()
  private nextId = this.accounts.size + 1

  private load(): Map<string, StoredAccount> {
    const raw = window.localStorage.getItem(this.storageKey)
    if (raw === null) return new Map()
    try {
      const accounts = JSON.parse(raw) as Array<
        Omit<StoredAccount, 'createdAt' | 'updatedAt' | 'balancesUpdatedAt'> & {
          createdAt: string
          updatedAt: string
          balancesUpdatedAt?: string | null
        }
      >
      return new Map(
        accounts.map((account) => {
          const { createdAt, updatedAt, balancesUpdatedAt, ...values } = account
          const parsed: StoredAccount = {
            ...values,
            ...(balancesUpdatedAt === undefined
              ? {}
              : {
                  balancesUpdatedAt:
                    balancesUpdatedAt === null
                      ? null
                      : new Date(balancesUpdatedAt),
                }),
            createdAt: new Date(createdAt),
            updatedAt: new Date(updatedAt),
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
      [...this.accounts.values()]
        .filter((account) => account.groupId === groupId)
        .map(readAccount),
    )
  }
  create(input: PersistAccountInput): Promise<Account> {
    const id = `account-${this.nextId++}`
    const timestamp = new Date()
    const account: StoredAccount = {
      ...input,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.accounts.set(`${input.groupId}:${id}`, account)
    this.persist()
    return Promise.resolve(readAccount(account))
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
    return Promise.resolve(readAccount(account))
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
