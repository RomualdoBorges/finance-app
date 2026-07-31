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
  readonly status: AccountStatus
  readonly isArchived: boolean
  readonly createdBy: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type CreateAccountInput = Pick<
  Account,
  'name' | 'description' | 'institutionName' | 'icon' | 'color'
>

export type UpdateAccountInput = CreateAccountInput & {
  readonly accountId: string
}

export type PersistAccountInput = Omit<
  Account,
  'id' | 'createdAt' | 'updatedAt'
>
export type PersistAccountUpdate = Pick<
  Account,
  | 'name'
  | 'normalizedName'
  | 'description'
  | 'institutionName'
  | 'icon'
  | 'color'
>
