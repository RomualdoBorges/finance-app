import { z } from 'zod'

import {
  ACTIVE_CATEGORY_STATUS,
  type Category,
  type CreateCustomCategoryInput,
} from '../domain/Category'
import { CategoryError } from '../domain/CategoryError'
import {
  categoryIdentitySchema,
  createCustomCategorySchema,
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
    const parent =
      parsed.parentCategoryId === null
        ? null
        : (categories.find(
            (category) => category.id === parsed.parentCategoryId,
          ) ?? null)

    if (parsed.parentCategoryId !== null && parent === null) {
      throw new CategoryError('parent-not-found')
    }
    if (parent !== null && parent.parentCategoryId !== null) {
      throw new CategoryError('parent-is-subcategory')
    }
    if (parent !== null && parent.type !== parsed.type) {
      throw new CategoryError('type-mismatch')
    }

    const normalizedName = normalizeCategoryName(parsed.name)
    const duplicate = categories.some(
      (category) =>
        category.status === ACTIVE_CATEGORY_STATUS &&
        category.type === parsed.type &&
        category.parentCategoryId === parsed.parentCategoryId &&
        category.normalizedName === normalizedName,
    )
    if (duplicate) throw new CategoryError('duplicate')

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
      createdBy: identity.userId,
    })
  }
}
