import type { AccountType } from './accountTypes'

export const ACCOUNT_STATUSES = ['active', 'archived'] as const
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export type Account = {
  readonly id: string
  readonly groupId: string
  readonly name: string
  readonly normalizedName: string
  readonly description: string | null
  readonly institutionName: string | null
  readonly icon: string | null
  readonly color: string | null
  readonly accountType: AccountType
  readonly includeInBalance: boolean
  readonly includeInNetWorth: boolean
  readonly initialBalanceMinor: number
  readonly initialBalanceDate: string | null
  readonly currentBalanceMinor: number
  readonly projectedBalanceMinor: number
  readonly balancesUpdatedAt: Date | null
  readonly status: AccountStatus
  readonly isArchived: boolean
  readonly createdBy: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type CreateAccountInput = Pick<
  Account,
  | 'name'
  | 'description'
  | 'institutionName'
  | 'icon'
  | 'color'
  | 'accountType'
  | 'includeInBalance'
  | 'includeInNetWorth'
> & {
  readonly initialBalanceMinor: number
  readonly initialBalanceDate: string
}

export type UpdateAccountInput = CreateAccountInput & {
  readonly accountId: string
}

export type PersistAccountInput = Omit<
  Account,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'currentBalanceMinor'
  | 'projectedBalanceMinor'
  | 'balancesUpdatedAt'
>
export type PersistAccountUpdate = Pick<
  Account,
  | 'name'
  | 'normalizedName'
  | 'description'
  | 'institutionName'
  | 'icon'
  | 'color'
  | 'accountType'
  | 'includeInBalance'
  | 'includeInNetWorth'
  | 'initialBalanceMinor'
  | 'initialBalanceDate'
>
