import type {
  Category,
  CategoryDefinition,
  PersistCategoryInput,
  PersistCategoryUpdate,
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
  update(
    groupId: string,
    categoryId: string,
    input: PersistCategoryUpdate,
  ): Promise<Category>
  setArchived(
    groupId: string,
    categoryIds: readonly string[],
    archived: boolean,
  ): Promise<void>
  delete(groupId: string, categoryId: string): Promise<void>
  ensureDefaults(input: EnsureDefaultCategoriesInput): Promise<void>
}
