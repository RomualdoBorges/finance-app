import { describe, expect, it, vi } from 'vitest'

import {
  ACTIVE_CATEGORY_STATUS,
  type Category,
  type PersistCategoryInput,
} from '../domain/Category'
import { defaultCategoryCatalog } from '../domain/defaultCategoryCatalog'
import type { CategoryRepository } from '../repositories/CategoryRepository'
import { CategoryService } from './CategoryService'

const timestamp = new Date('2026-01-01T00:00:00Z')

function category(
  overrides: Partial<Category> &
    Pick<Category, 'id' | 'name' | 'normalizedName'>,
): Category {
  return {
    groupId: 'group-1',
    type: 'expense',
    origin: 'default',
    status: ACTIVE_CATEGORY_STATUS,
    parentCategoryId: null,
    icon: null,
    createdBy: 'user-1',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function setup(initial: readonly Category[] = []) {
  const values = [...initial]
  const listByGroup = vi.fn(() => Promise.resolve(values))
  const create = vi.fn((input: PersistCategoryInput) => {
    const created = category({
      ...input,
      id: 'custom-1',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    values.push(created)
    return Promise.resolve(created)
  })
  const ensureDefaults = vi.fn(() => Promise.resolve())
  const repository: CategoryRepository = {
    listByGroup,
    getById: vi.fn(),
    create,
    ensureDefaults,
  }
  return {
    create,
    ensureDefaults,
    listByGroup,
    service: new CategoryService(repository),
  }
}

describe('CategoryService', () => {
  it('garante catálogo padrão pelo grupo ativo e lista o resultado', async () => {
    const { ensureDefaults, listByGroup, service } = setup()
    await service.ensureDefaultCategories({
      groupId: 'group-1',
      userId: 'user-1',
    })
    expect(ensureDefaults).toHaveBeenCalledWith({
      groupId: 'group-1',
      userId: 'user-1',
      definitions: defaultCategoryCatalog,
    })
    expect(listByGroup).toHaveBeenCalledWith('group-1')
  })

  it('cria categoria principal personalizada normalizada', async () => {
    const { create, service } = setup()
    await service.createCustomCategory(
      { groupId: 'group-1', userId: 'user-1' },
      { name: '  Educação Física ', type: 'expense' },
    )
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'group-1',
        name: 'Educação Física',
        normalizedName: 'educacao fisica',
        type: 'expense',
        origin: 'custom',
        parentCategoryId: null,
        createdBy: 'user-1',
      }),
    )
  })

  it('cria subcategoria quando pai é raiz do mesmo tipo', async () => {
    const parent = category({
      id: 'parent',
      name: 'Casa',
      normalizedName: 'casa',
    })
    const { service } = setup([parent])
    await expect(
      service.createCustomCategory(
        { groupId: 'group-1', userId: 'user-1' },
        {
          name: 'Reparos',
          type: 'expense',
          parentCategoryId: parent.id,
        },
      ),
    ).resolves.toMatchObject({ parentCategoryId: parent.id })
  })

  it.each([
    {
      name: 'pai ausente',
      categories: [],
      input: {
        name: 'Reparos',
        type: 'expense' as const,
        parentCategoryId: 'missing',
      },
      code: 'parent-not-found',
    },
    {
      name: 'profundidade maior que um',
      categories: [
        category({
          id: 'child',
          name: 'Filha',
          normalizedName: 'filha',
          parentCategoryId: 'root',
        }),
      ],
      input: {
        name: 'Neta',
        type: 'expense' as const,
        parentCategoryId: 'child',
      },
      code: 'parent-is-subcategory',
    },
    {
      name: 'tipo diferente do pai',
      categories: [
        category({
          id: 'income',
          name: 'Receitas',
          normalizedName: 'receitas',
          type: 'income',
        }),
      ],
      input: {
        name: 'Extra',
        type: 'expense' as const,
        parentCategoryId: 'income',
      },
      code: 'type-mismatch',
    },
  ])('rejeita $name', async ({ categories, input, code }) => {
    const { service } = setup(categories)
    await expect(
      service.createCustomCategory(
        { groupId: 'group-1', userId: 'user-1' },
        input,
      ),
    ).rejects.toMatchObject({ code })
  })

  it('rejeita duplicidade normalizada somente entre irmãos', async () => {
    const existing = category({
      id: 'education',
      name: 'Educação',
      normalizedName: 'educacao',
    })
    const { service } = setup([existing])
    await expect(
      service.createCustomCategory(
        { groupId: 'group-1', userId: 'user-1' },
        { name: ' EDUCAÇÃO ', type: 'expense' },
      ),
    ).rejects.toMatchObject({ code: 'duplicate' })

    await expect(
      service.createCustomCategory(
        { groupId: 'group-1', userId: 'user-1' },
        { name: 'Educação', type: 'income' },
      ),
    ).resolves.toMatchObject({ type: 'income' })
  })
})
