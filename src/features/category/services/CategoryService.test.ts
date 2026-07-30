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
    usageCount: 0,
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
  const update = vi.fn(
    (
      _groupId: string,
      categoryId: string,
      input: Parameters<CategoryRepository['update']>[2],
    ) => {
      const index = values.findIndex(({ id }) => id === categoryId)
      const updated = { ...values[index], ...input } as Category
      values[index] = updated
      return Promise.resolve(updated)
    },
  )
  const setArchived = vi.fn(() => Promise.resolve())
  const remove = vi.fn(() => Promise.resolve())
  const repository: CategoryRepository = {
    listByGroup,
    getById: vi.fn(),
    create,
    update,
    setArchived,
    delete: remove,
    ensureDefaults,
  }
  return {
    create,
    ensureDefaults,
    listByGroup,
    update,
    setArchived,
    remove,
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

  it('edita categoria personalizada preservando campos protegidos', async () => {
    const current = category({
      id: 'custom',
      name: 'Casa',
      normalizedName: 'casa',
      origin: 'custom',
    })
    const { service, update } = setup([current])
    await service.updateCategory(
      { groupId: 'group-1', userId: 'user-1' },
      {
        categoryId: current.id,
        name: 'Moradia',
        type: 'expense',
        parentCategoryId: null,
        icon: 'house',
      },
    )
    expect(update).toHaveBeenCalledWith(
      'group-1',
      current.id,
      expect.objectContaining({
        name: 'Moradia',
        normalizedName: 'moradia',
      }),
    )
    expect(update.mock.calls[0]?.[2]).not.toHaveProperty('createdAt')
    expect(update.mock.calls[0]?.[2]).not.toHaveProperty('createdBy')
  })

  it('mantém tipo e pai imutáveis ao editar categoria padrão', async () => {
    const current = category({
      id: 'default',
      name: 'Casa',
      normalizedName: 'casa',
      origin: 'default',
    })
    const { service, update } = setup([current])
    await service.updateCategory(
      { groupId: 'group-1', userId: 'user-1' },
      {
        categoryId: current.id,
        name: 'Moradia',
        type: 'income',
        parentCategoryId: 'other',
        icon: 'house',
      },
    )
    expect(update).toHaveBeenCalledWith(
      'group-1',
      current.id,
      expect.objectContaining({ type: 'expense', parentCategoryId: null }),
    )
  })

  it('arquiva pai e filhas ativas em cascata', async () => {
    const root = category({
      id: 'root',
      name: 'Casa',
      normalizedName: 'casa',
    })
    const child = category({
      id: 'child',
      name: 'Aluguel',
      normalizedName: 'aluguel',
      parentCategoryId: root.id,
    })
    const { service, setArchived } = setup([root, child])
    await service.archiveCategory(
      { groupId: 'group-1', userId: 'user-1' },
      { categoryId: root.id },
    )
    expect(setArchived).toHaveBeenCalledWith('group-1', ['root', 'child'], true)
  })

  it('restaura apenas quando o pai está ativo e não há duplicidade', async () => {
    const root = category({
      id: 'root',
      name: 'Casa',
      normalizedName: 'casa',
    })
    const child = category({
      id: 'child',
      name: 'Aluguel',
      normalizedName: 'aluguel',
      parentCategoryId: root.id,
      status: 'archived',
    })
    const { service, setArchived } = setup([root, child])
    await service.restoreCategory(
      { groupId: 'group-1', userId: 'user-1' },
      { categoryId: child.id },
    )
    expect(setArchived).toHaveBeenCalledWith('group-1', ['child'], false)
  })

  it.each([
    {
      label: 'padrão',
      value: category({
        id: 'default',
        name: 'Casa',
        normalizedName: 'casa',
      }),
      code: 'default-delete-forbidden',
    },
    {
      label: 'usada',
      value: category({
        id: 'used',
        name: 'Pets',
        normalizedName: 'pets',
        origin: 'custom',
        usageCount: 1,
      }),
      code: 'category-in-use',
    },
    {
      label: 'principal personalizada',
      value: category({
        id: 'custom-root',
        name: 'Pets',
        normalizedName: 'pets',
        origin: 'custom',
      }),
      code: 'root-delete-forbidden',
    },
  ])('não exclui categoria $label', async ({ value, code }) => {
    const { service, remove } = setup([value])
    await expect(
      service.deleteCategory(
        { groupId: 'group-1', userId: 'user-1' },
        { categoryId: value.id },
      ),
    ).rejects.toMatchObject({ code })
    expect(remove).not.toHaveBeenCalled()
  })

  it('exclui categoria personalizada nunca usada e sem filhas', async () => {
    const root = category({
      id: 'root',
      name: 'Casa',
      normalizedName: 'casa',
    })
    const custom = category({
      id: 'custom',
      name: 'Pets',
      normalizedName: 'pets',
      origin: 'custom',
      parentCategoryId: root.id,
    })
    const { service, remove } = setup([root, custom])
    await service.deleteCategory(
      { groupId: 'group-1', userId: 'user-1' },
      { categoryId: custom.id },
    )
    expect(remove).toHaveBeenCalledWith('group-1', custom.id)
  })
})
