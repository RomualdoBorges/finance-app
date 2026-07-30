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
})
