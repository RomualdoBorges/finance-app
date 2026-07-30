import type {
  Category,
  PersistCategoryInput,
  PersistCategoryUpdate,
} from '../domain/Category'
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

  update(
    groupId: string,
    categoryId: string,
    input: PersistCategoryUpdate,
  ): Promise<Category> {
    const key = `${groupId}:${categoryId}`
    const current = this.categories.get(key)
    if (current === undefined) return Promise.reject(new Error('not found'))
    const updated = { ...current, ...input, updatedAt: new Date() }
    this.categories.set(key, updated)
    return Promise.resolve(updated)
  }

  setArchived(
    groupId: string,
    categoryIds: readonly string[],
    archived: boolean,
  ): Promise<void> {
    for (const categoryId of categoryIds) {
      const key = `${groupId}:${categoryId}`
      const current = this.categories.get(key)
      if (current !== undefined) {
        this.categories.set(key, {
          ...current,
          status: archived ? 'archived' : 'active',
          updatedAt: new Date(),
        })
      }
    }
    return Promise.resolve()
  }

  delete(groupId: string, categoryId: string): Promise<void> {
    this.categories.delete(`${groupId}:${categoryId}`)
    return Promise.resolve()
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
          usageCount: 0,
          createdBy: userId,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      }
    }
    return Promise.resolve()
  }
}
