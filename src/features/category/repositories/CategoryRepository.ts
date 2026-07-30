import type {
  Category,
  CategoryDefinition,
  PersistCategoryInput,
} from '../domain/Category'

export type EnsureDefaultCategoriesInput = {
  readonly groupId: string
  readonly userId: string
  readonly definitions: readonly CategoryDefinition[]
}

export interface CategoryRepository {
  listByGroup(groupId: string): Promise<readonly Category[]>
  getById(groupId: string, categoryId: string): Promise<Category | null>
  create(input: PersistCategoryInput): Promise<Category>
  ensureDefaults(input: EnsureDefaultCategoriesInput): Promise<void>
}
