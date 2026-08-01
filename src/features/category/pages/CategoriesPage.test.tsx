import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Category, CreateCustomCategoryInput } from '../domain/Category'
import { CategoriesPage } from './CategoriesPage'

type CategoriesHookResult = {
  readonly categories: readonly Category[]
  readonly loading: boolean
  readonly error: Error | null
  readonly refresh: () => Promise<void>
}

const useCategoriesMock = vi.fn<() => CategoriesHookResult>()
const createCategoryMock =
  vi.fn<(input: CreateCustomCategoryInput) => Promise<unknown>>()
const archiveCategoryMock = vi.fn().mockResolvedValue(undefined)

vi.mock('../hooks/useCategories', () => ({
  useCategories: () => useCategoriesMock(),
}))

vi.mock('../hooks/useCreateCategory', () => ({
  useCreateCategory: () => ({
    createCategory: createCategoryMock,
    creating: false,
    error: null,
    reset: vi.fn(),
  }),
}))

vi.mock('../hooks/useCategoryMutations', () => ({
  useCategoryMutations: () => ({
    updateCategory: vi.fn(),
    archiveCategory: archiveCategoryMock,
    restoreCategory: vi.fn(),
    deleteCategory: vi.fn(),
    pending: false,
    error: null,
    reset: vi.fn(),
  }),
}))

const timestamp = new Date('2026-01-01T00:00:00Z')
const categories: readonly Category[] = [
  {
    id: 'expense-housing',
    groupId: 'group-1',
    name: 'Moradia',
    normalizedName: 'moradia',
    type: 'expense',
    origin: 'default',
    status: 'active',
    parentCategoryId: null,
    icon: 'house',
    usageCount: 0,
    createdBy: 'user-1',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'expense-housing-rent',
    groupId: 'group-1',
    name: 'Aluguel',
    normalizedName: 'aluguel',
    type: 'expense',
    origin: 'default',
    status: 'active',
    parentCategoryId: 'expense-housing',
    icon: null,
    usageCount: 0,
    createdBy: 'user-1',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: 'income-salary',
    groupId: 'group-1',
    name: 'Salário',
    normalizedName: 'salario',
    type: 'income',
    origin: 'default',
    status: 'active',
    parentCategoryId: null,
    icon: 'wallet-cards',
    usageCount: 0,
    createdBy: 'user-1',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

describe('CategoriesPage', () => {
  beforeEach(() => {
    useCategoriesMock.mockReturnValue({
      categories,
      loading: false,
      error: null,
      refresh: () => Promise.resolve(),
    })
    createCategoryMock.mockResolvedValue(undefined)
  })

  it('agrupa receitas, despesas e subcategorias', () => {
    render(<CategoriesPage />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Categorias' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Despesas' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Receitas' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Moradia')).toBeInTheDocument()
    expect(screen.getByText('Aluguel')).toBeInTheDocument()
    expect(screen.getByText('Salário')).toBeInTheDocument()
  })

  it('abre o formulário e envia uma categoria personalizada', async () => {
    const user = userEvent.setup()
    render(<CategoriesPage />)
    await user.click(
      screen.getByRole('button', { name: 'Adicionar categoria' }),
    )
    await user.type(screen.getByLabelText('Nome'), 'Pets')
    await user.click(screen.getByRole('button', { name: 'Salvar categoria' }))
    expect(createCategoryMock).toHaveBeenCalledWith({
      name: 'Pets',
      type: 'expense',
      parentCategoryId: null,
      icon: null,
    })
  })

  it('exibe loading e erro com retry', async () => {
    const refresh = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    useCategoriesMock.mockReturnValueOnce({
      categories: [],
      loading: true,
      error: null,
      refresh,
    })
    const { rerender } = render(<CategoriesPage />)
    expect(screen.getByText('Preparando categorias…')).toBeInTheDocument()

    useCategoriesMock.mockReturnValue({
      categories: [],
      loading: false,
      error: new Error('Falha controlada'),
      refresh,
    })
    rerender(<CategoriesPage />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    )
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('diferencia arquivada e explica por que categoria usada não é excluída', () => {
    useCategoriesMock.mockReturnValue({
      categories: [
        {
          ...categories[0]!,
          status: 'archived',
          usageCount: 2,
        },
      ],
      loading: false,
      error: null,
      refresh: () => Promise.resolve(),
    })
    render(<CategoriesPage />)
    expect(screen.getByText(/Arquivada — mantida/)).toBeInTheDocument()
    expect(screen.getByText(/Já utilizada/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Excluir' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Restaurar' }),
    ).toBeInTheDocument()
  })

  it('confirma antes de arquivar', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CategoriesPage />)
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Arquivar' })[0]!,
    )
    expect(confirm).toHaveBeenCalledOnce()
    expect(archiveCategoryMock).toHaveBeenCalled()
    confirm.mockRestore()
  })
})
