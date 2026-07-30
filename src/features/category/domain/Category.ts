export const CATEGORY_TYPES = ['income', 'expense'] as const
export const CATEGORY_ORIGINS = ['default', 'custom'] as const
export const ACTIVE_CATEGORY_STATUS = 'active' as const

export type CategoryType = (typeof CATEGORY_TYPES)[number]
export type CategoryOrigin = (typeof CATEGORY_ORIGINS)[number]

export type Category = {
  readonly id: string
  readonly groupId: string
  readonly name: string
  readonly normalizedName: string
  readonly type: CategoryType
  readonly origin: CategoryOrigin
  readonly status: typeof ACTIVE_CATEGORY_STATUS
  readonly parentCategoryId: string | null
  readonly icon: string | null
  readonly createdBy: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type CategoryDefinition = Pick<
  Category,
  'id' | 'name' | 'normalizedName' | 'type' | 'parentCategoryId' | 'icon'
>

export type CreateCustomCategoryInput = {
  readonly name: string
  readonly type: CategoryType
  readonly parentCategoryId?: string | null
  readonly icon?: string | null
}

export type PersistCategoryInput = Omit<Category, 'createdAt' | 'updatedAt'>
