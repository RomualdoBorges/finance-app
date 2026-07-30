import type { Firestore } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'

import { CategoryError } from '../domain/CategoryError'
import type { PersistCategoryInput } from '../domain/Category'
import {
  FirestoreCategoryRepository,
  mapCategorySnapshot,
  type FirestoreCategoryOperations,
} from './FirestoreCategoryRepository'

const date = new Date('2026-01-01T00:00:00Z')
const timestamp = { toDate: () => date }
const data = {
  groupId: 'group-1',
  name: 'Moradia',
  normalizedName: 'moradia',
  type: 'expense',
  origin: 'default',
  status: 'active',
  parentCategoryId: null,
  icon: 'house',
  createdBy: 'user-1',
  createdAt: timestamp,
  updatedAt: timestamp,
}

function operations(
  overrides: Partial<FirestoreCategoryOperations> = {},
): FirestoreCategoryOperations {
  return {
    categoryCollection: vi.fn().mockReturnValue({ kind: 'collection' }),
    categoryReference: vi.fn().mockReturnValue({ kind: 'document' }),
    newCategoryReference: vi.fn().mockReturnValue({
      id: 'custom-id',
      reference: { kind: 'new-document' },
    }),
    getCategory: vi.fn().mockResolvedValue({
      id: 'custom-id',
      exists: true,
      data: { ...data, origin: 'custom', icon: null },
    }),
    listCategories: vi.fn().mockResolvedValue([]),
    setCategory: vi.fn().mockResolvedValue(undefined),
    createBatch: vi.fn().mockReturnValue({
      set: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    }),
    serverTimestamp: vi.fn().mockReturnValue({ serverTimestamp: true }),
    ...overrides,
  }
}

describe('mapCategorySnapshot', () => {
  it('converte Timestamp para Date e preserva o contrato do domínio', () => {
    expect(
      mapCategorySnapshot('group-1', {
        id: 'expense-housing',
        exists: true,
        data,
      }),
    ).toEqual({
      id: 'expense-housing',
      ...data,
      createdAt: date,
      updatedAt: date,
    })
  })

  it('rejeita documento de outro grupo ou fora do contrato', () => {
    expect(() =>
      mapCategorySnapshot('group-2', {
        id: 'expense-housing',
        exists: true,
        data,
      }),
    ).toThrowError(CategoryError)
  })
})

describe('FirestoreCategoryRepository', () => {
  it('persiste categoria customizada com ID gerado e timestamps do servidor', async () => {
    const categoryOperations = operations()
    const repository = new FirestoreCategoryRepository(
      {} as Firestore,
      categoryOperations,
    )
    const input: PersistCategoryInput = {
      id: '',
      groupId: 'group-1',
      name: 'Pets',
      normalizedName: 'pets',
      type: 'expense',
      origin: 'custom',
      status: 'active',
      parentCategoryId: null,
      icon: null,
      createdBy: 'user-1',
    }

    await expect(repository.create(input)).resolves.toMatchObject({
      id: 'custom-id',
      origin: 'custom',
    })
    expect(categoryOperations.setCategory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        groupId: 'group-1',
        name: 'Pets',
        createdAt: { serverTimestamp: true },
        updatedAt: { serverTimestamp: true },
      }),
    )
  })

  it('cria em lote somente defaults ausentes e usa IDs determinísticos', async () => {
    const set = vi.fn()
    const commit = vi.fn().mockResolvedValue(undefined)
    const categoryOperations = operations({
      listCategories: vi
        .fn()
        .mockResolvedValue([{ id: 'default-existing', exists: true, data }]),
      createBatch: vi.fn().mockReturnValue({ set, commit }),
    })
    const repository = new FirestoreCategoryRepository(
      {} as Firestore,
      categoryOperations,
    )

    await repository.ensureDefaults({
      groupId: 'group-1',
      userId: 'user-1',
      definitions: [
        {
          id: 'default-existing',
          name: 'Moradia',
          normalizedName: 'moradia',
          type: 'expense',
          parentCategoryId: null,
          icon: 'house',
        },
        {
          id: 'default-missing',
          name: 'Saúde',
          normalizedName: 'saude',
          type: 'expense',
          parentCategoryId: null,
          icon: 'heart-pulse',
        },
      ],
    })

    expect(set).toHaveBeenCalledTimes(1)
    expect(categoryOperations.categoryReference).toHaveBeenCalledWith(
      expect.anything(),
      'group-1',
      'default-missing',
    )
    expect(commit).toHaveBeenCalledOnce()
  })

  it('não escreve nem gera timestamp quando o catálogo já existe', async () => {
    const categoryOperations = operations({
      listCategories: vi
        .fn()
        .mockResolvedValue([{ id: 'default-existing', exists: true, data }]),
    })
    const repository = new FirestoreCategoryRepository(
      {} as Firestore,
      categoryOperations,
    )
    await repository.ensureDefaults({
      groupId: 'group-1',
      userId: 'user-1',
      definitions: [
        {
          id: 'default-existing',
          name: 'Moradia',
          normalizedName: 'moradia',
          type: 'expense',
          parentCategoryId: null,
          icon: 'house',
        },
      ],
    })
    expect(categoryOperations.createBatch).not.toHaveBeenCalled()
    expect(categoryOperations.serverTimestamp).not.toHaveBeenCalled()
  })
})
