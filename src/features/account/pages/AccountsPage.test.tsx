/* eslint-disable @typescript-eslint/no-unsafe-return -- mocks de módulos do Vitest são dinamicamente tipados neste teste de página */
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/render'
import type { Account } from '../domain/Account'
import { AccountsPage } from './AccountsPage'

const useAccounts = vi.fn()
const archiveAccount = vi.fn().mockResolvedValue(undefined)
const restoreAccount = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/useAccounts', () => ({ useAccounts: () => useAccounts() }))
vi.mock('../hooks/useAccountMutations', () => ({
  useAccountMutations: () => ({
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    archiveAccount,
    restoreAccount,
    pending: false,
    error: null,
  }),
}))
const account: Account = {
  id: 'a1',
  groupId: 'g1',
  name: 'Principal',
  normalizedName: 'principal',
  description: null,
  institutionName: 'Banco',
  icon: null,
  color: null,
  status: 'active',
  isArchived: false,
  createdBy: 'u1',
  createdAt: new Date(),
  updatedAt: new Date(),
}
describe('AccountsPage', () => {
  beforeEach(() => {
    useAccounts.mockReturnValue({
      accounts: [
        account,
        {
          ...account,
          id: 'a2',
          name: 'Antiga',
          isArchived: true,
          status: 'archived',
        },
      ],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
  })
  it('lista ativas e arquivadas, sem exclusão física', () => {
    renderWithProviders(<AccountsPage />)
    expect(screen.getByText('Contas ativas')).toBeInTheDocument()
    expect(screen.getByText('Contas arquivadas')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /excluir/i }),
    ).not.toBeInTheDocument()
  })
  it('exibe loading, erro e vazio', () => {
    useAccounts.mockReturnValueOnce({
      accounts: [],
      loading: true,
      error: null,
      refresh: vi.fn(),
    })
    const { rerender } = renderWithProviders(<AccountsPage />)
    expect(screen.getByText('Carregando contas…')).toBeInTheDocument()
    useAccounts.mockReturnValueOnce({
      accounts: [],
      loading: false,
      error: new Error('Falha'),
      refresh: vi.fn(),
    })
    rerender(<AccountsPage />)
    expect(screen.getByText('Falha')).toBeInTheDocument()
    useAccounts.mockReturnValueOnce({
      accounts: [],
      loading: false,
      error: null,
      refresh: vi.fn(),
    })
    rerender(<AccountsPage />)
    expect(screen.getByText('Nenhuma conta cadastrada')).toBeInTheDocument()
  })
  it('exige confirmação em diálogo antes de arquivar', async () => {
    renderWithProviders(<AccountsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    expect(
      screen.getByRole('heading', { name: 'Arquivar conta?' }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Arquivar conta' }),
    )
    expect(archiveAccount).toHaveBeenCalledWith({ accountId: 'a1' })
  })
})
