import { z } from 'zod'

import {
  ACTIVE_CATEGORY_STATUS,
  type Category,
  type CreateCustomCategoryInput,
  type UpdateCategoryInput,
} from '../domain/Category'
import { CategoryError } from '../domain/CategoryError'
import {
  categoryIdentitySchema,
  categoryActionSchema,
  createCustomCategorySchema,
  updateCategorySchema,
} from '../domain/categorySchemas'
import { defaultCategoryCatalog } from '../domain/defaultCategoryCatalog'
import { normalizeCategoryName } from '../domain/normalizeCategoryName'
import type { CategoryRepository } from '../repositories/CategoryRepository'

type CategoryContext = {
  readonly groupId: string
  readonly userId: string
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    throw new CategoryError('invalid-input', { cause: result.error })
  }
  return result.data
}

function compareCategories(left: Category, right: Category): number {
  if (left.type !== right.type) return left.type === 'expense' ? -1 : 1
  if (left.parentCategoryId === null && right.parentCategoryId !== null)
    return -1
  if (left.parentCategoryId !== null && right.parentCategoryId === null)
    return 1
  return left.name.localeCompare(right.name, 'pt-BR')
}

function findCategory(
  categories: readonly Category[],
  categoryId: string,
): Category {
  const category = categories.find(({ id }) => id === categoryId)
  if (category === undefined) throw new CategoryError('category-not-found')
  return category
}

function validateParent(
  categories: readonly Category[],
  categoryId: string | null,
  type: Category['type'],
  editedCategoryId?: string,
): Category | null {
  if (categoryId === null) return null
  if (categoryId === editedCategoryId) {
    throw new CategoryError('invalid-relationship')
  }
  const parent = categories.find(({ id }) => id === categoryId)
  if (parent === undefined) throw new CategoryError('parent-not-found')
  if (parent.status === 'archived') throw new CategoryError('parent-archived')
  if (parent.parentCategoryId !== null) {
    throw new CategoryError('parent-is-subcategory')
  }
  if (parent.type !== type) throw new CategoryError('type-mismatch')
  return parent
}

function assertUnique(
  categories: readonly Category[],
  input: {
    readonly normalizedName: string
    readonly type: Category['type']
    readonly parentCategoryId: string | null
    readonly excludedId?: string
  },
): void {
  const duplicate = categories.some(
    (category) =>
      category.id !== input.excludedId &&
      category.status === ACTIVE_CATEGORY_STATUS &&
      category.type === input.type &&
      category.parentCategoryId === input.parentCategoryId &&
      category.normalizedName === input.normalizedName,
  )
  if (duplicate) throw new CategoryError('duplicate')
}

export class CategoryService {
  private readonly repository: CategoryRepository

  constructor(repository: CategoryRepository) {
    this.repository = repository
  }

  async ensureDefaultCategories(
    context: CategoryContext,
  ): Promise<readonly Category[]> {
    const parsed = parseOrThrow(categoryIdentitySchema, context)
    await this.repository.ensureDefaults({
      ...parsed,
      definitions: defaultCategoryCatalog,
    })
    return this.listByGroup(parsed.groupId)
  }

  async listByGroup(groupId: string): Promise<readonly Category[]> {
    const parsed = parseOrThrow(
      categoryIdentitySchema.pick({ groupId: true }),
      { groupId },
    )
    const categories = await this.repository.listByGroup(parsed.groupId)
    return [...categories].sort(compareCategories)
  }

  async createCustomCategory(
    context: CategoryContext,
    input: CreateCustomCategoryInput,
  ): Promise<Category> {
    const identity = parseOrThrow(categoryIdentitySchema, context)
    const parsed = parseOrThrow(createCustomCategorySchema, input)
    const categories = await this.repository.listByGroup(identity.groupId)
    validateParent(categories, parsed.parentCategoryId, parsed.type)

    const normalizedName = normalizeCategoryName(parsed.name)
    assertUnique(categories, { ...parsed, normalizedName })

    return this.repository.create({
      id: '',
      groupId: identity.groupId,
      name: parsed.name,
      normalizedName,
      type: parsed.type,
      origin: 'custom',
      status: ACTIVE_CATEGORY_STATUS,
      parentCategoryId: parsed.parentCategoryId,
      icon: parsed.icon,
      usageCount: 0,
      createdBy: identity.userId,
    })
  }

  async updateCategory(
    context: CategoryContext,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    const identity = parseOrThrow(categoryIdentitySchema, context)
    const parsed = parseOrThrow(updateCategorySchema, input)
    const categories = await this.repository.listByGroup(identity.groupId)
    const current = findCategory(categories, parsed.categoryId)
    if (current.status === 'archived') {
      throw new CategoryError('invalid-input')
    }

    const type = current.origin === 'default' ? current.type : parsed.type
    const parentCategoryId =
      current.origin === 'default'
        ? current.parentCategoryId
        : parsed.parentCategoryId
    validateParent(categories, parentCategoryId, type, current.id)

    const activeChildren = categories.filter(
      ({ parentCategoryId: parentId, status }) =>
        parentId === current.id && status === ACTIVE_CATEGORY_STATUS,
    )
    if (
      activeChildren.length > 0 &&
      (parentCategoryId !== null || type !== current.type)
    ) {
      throw new CategoryError('active-children')
    }

    const normalizedName = normalizeCategoryName(parsed.name)
    assertUnique(categories, {
      normalizedName,
      type,
      parentCategoryId,
      excludedId: current.id,
    })
    return this.repository.update(identity.groupId, current.id, {
      name: parsed.name,
      normalizedName,
      type,
      parentCategoryId,
      icon: parsed.icon,
    })
  }

  async archiveCategory(
    context: CategoryContext,
    input: { readonly categoryId: string },
  ): Promise<void> {
    const identity = parseOrThrow(categoryIdentitySchema, context)
    const action = parseOrThrow(categoryActionSchema, input)
    const categories = await this.repository.listByGroup(identity.groupId)
    const category = findCategory(categories, action.categoryId)
    if (category.status === 'archived') return
    const children = categories.filter(
      ({ parentCategoryId, status }) =>
        parentCategoryId === category.id && status === ACTIVE_CATEGORY_STATUS,
    )
    await this.repository.setArchived(
      identity.groupId,
      [category.id, ...children.map(({ id }) => id)],
      true,
    )
  }

  async restoreCategory(
    context: CategoryContext,
    input: { readonly categoryId: string },
  ): Promise<void> {
    const identity = parseOrThrow(categoryIdentitySchema, context)
    const action = parseOrThrow(categoryActionSchema, input)
    const categories = await this.repository.listByGroup(identity.groupId)
    const category = findCategory(categories, action.categoryId)
    if (category.status === ACTIVE_CATEGORY_STATUS) return
    validateParent(categories, category.parentCategoryId, category.type)
    assertUnique(categories, {
      normalizedName: category.normalizedName,
      type: category.type,
      parentCategoryId: category.parentCategoryId,
      excludedId: category.id,
    })
    await this.repository.setArchived(identity.groupId, [category.id], false)
  }

  async deleteCategory(
    context: CategoryContext,
    input: { readonly categoryId: string },
  ): Promise<void> {
    const identity = parseOrThrow(categoryIdentitySchema, context)
    const action = parseOrThrow(categoryActionSchema, input)
    const categories = await this.repository.listByGroup(identity.groupId)
    const category = findCategory(categories, action.categoryId)
    if (category.origin === 'default') {
      throw new CategoryError('default-delete-forbidden')
    }
    if (category.usageCount > 0) throw new CategoryError('category-in-use')
    if (category.parentCategoryId === null) {
      throw new CategoryError('root-delete-forbidden')
    }
    if (
      categories.some(
        ({ parentCategoryId }) => parentCategoryId === category.id,
      )
    ) {
      throw new CategoryError('active-children')
    }
    await this.repository.delete(identity.groupId, category.id)
  }
}
