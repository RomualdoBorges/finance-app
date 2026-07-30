export const CATEGORY_TYPES = ['income', 'expense'] as const
export const CATEGORY_ORIGINS = ['default', 'custom'] as const
export const CATEGORY_STATUSES = ['active', 'archived'] as const
export const ACTIVE_CATEGORY_STATUS = CATEGORY_STATUSES[0]

export type CategoryType = (typeof CATEGORY_TYPES)[number]
export type CategoryOrigin = (typeof CATEGORY_ORIGINS)[number]
export type CategoryStatus = (typeof CATEGORY_STATUSES)[number]

export type Category = {
  readonly id: string
  readonly groupId: string
  readonly name: string
  readonly normalizedName: string
  readonly type: CategoryType
  readonly origin: CategoryOrigin
  readonly status: CategoryStatus
  readonly parentCategoryId: string | null
  readonly icon: string | null
  readonly usageCount: number
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

export type UpdateCategoryInput = {
  readonly categoryId: string
  readonly name: string
  readonly type: CategoryType
  readonly parentCategoryId?: string | null
  readonly icon?: string | null
}

export type PersistCategoryInput = Omit<Category, 'createdAt' | 'updatedAt'>

export type PersistCategoryUpdate = Pick<
  Category,
  'name' | 'normalizedName' | 'type' | 'parentCategoryId' | 'icon'
>
