import type { Category, PersistCategoryInput } from '../domain/Category'
import type {
  CategoryRepository,
  EnsureDefaultCategoriesInput,
} from './CategoryRepository'

export class E2ECategoryRepository implements CategoryRepository {
  private readonly categories = new Map<string, Category>()
  private nextCustomId = 1

  listByGroup(groupId: string): Promise<readonly Category[]> {
    return Promise.resolve(
      [...this.categories.values()].filter(
        (category) => category.groupId === groupId,
      ),
    )
  }

  getById(groupId: string, categoryId: string): Promise<Category | null> {
    const category = this.categories.get(`${groupId}:${categoryId}`)
    return Promise.resolve(category ?? null)
  }

  create(input: PersistCategoryInput): Promise<Category> {
    const timestamp = new Date()
    const id = `custom-${this.nextCustomId}`
    this.nextCustomId += 1
    const category = {
      ...input,
      id,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.categories.set(`${input.groupId}:${id}`, category)
    return Promise.resolve(category)
  }

  ensureDefaults({
    groupId,
    userId,
    definitions,
  }: EnsureDefaultCategoriesInput): Promise<void> {
    const timestamp = new Date('2026-01-01T00:00:00Z')
    for (const definition of definitions) {
      const key = `${groupId}:${definition.id}`
      if (!this.categories.has(key)) {
        this.categories.set(key, {
          ...definition,
          groupId,
          origin: 'default',
          status: 'active',
          createdBy: userId,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }
    return Promise.resolve()
  }
}
