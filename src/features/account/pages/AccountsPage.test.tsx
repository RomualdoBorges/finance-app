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
const createAccount = vi.fn().mockResolvedValue(undefined)
const updateAccount = vi.fn().mockResolvedValue(undefined)
vi.mock('../hooks/useAccounts', () => ({ useAccounts: () => useAccounts() }))
vi.mock('../hooks/useAccountMutations', () => ({
  useAccountMutations: () => ({
    createAccount,
    updateAccount,
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
  accountType: 'checking',
  includeInBalance: true,
  includeInNetWorth: true,
  initialBalanceMinor: 123456,
  initialBalanceDate: '2026-07-31',
  currentBalanceMinor: 123456,
  projectedBalanceMinor: 123456,
  balancesUpdatedAt: null,
  status: 'active',
  isArchived: false,
  createdBy: 'u1',
  createdAt: new Date(),
  updatedAt: new Date(),
}
describe('AccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  it('aplica defaults por tipo sem sobrescrever opção personalizada', async () => {
    renderWithProviders(<AccountsPage />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar conta' }),
    )
    const balance = screen.getByRole('checkbox', {
      name: /Incluir no saldo/,
    })
    const netWorth = screen.getByRole('checkbox', {
      name: /Incluir no patrimônio/,
    })
    expect(balance).toBeChecked()
    expect(netWorth).toBeChecked()
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo da conta' }),
      'credit_card',
    )
    expect(balance).not.toBeChecked()
    expect(netWorth).toBeChecked()
    await userEvent.click(netWorth)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Tipo da conta' }),
      'checking',
    )
    expect(balance).toBeChecked()
    expect(netWorth).not.toBeChecked()
  })
  it('lista ativas e arquivadas, sem exclusão física', () => {
    renderWithProviders(<AccountsPage />)
    expect(screen.getByText('Contas ativas')).toBeInTheDocument()
    expect(screen.getByText('Contas arquivadas')).toBeInTheDocument()
    expect(screen.getAllByText('Conta corrente')).toHaveLength(2)
    expect(screen.getAllByText(/Inclui no saldo/)).toHaveLength(2)
    expect(
      screen.getAllByText(/Saldo inicial: R\$\s*1\.234,56 em 31\/07\/2026/),
    ).toHaveLength(2)
    expect(
      screen.queryByRole('button', { name: /excluir/i }),
    ).not.toBeInTheDocument()
  })
  it('converte saldo em reais para centavos e orienta cartão de crédito', async () => {
    renderWithProviders(<AccountsPage />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar conta' }),
    )
    expect(screen.getByLabelText(/^Saldo inicial/)).toHaveValue('R$ 0,00')
    expect(screen.getByLabelText('Data do saldo inicial')).toHaveValue(
      new Date().toLocaleDateString('en-CA'),
    )
    await userEvent.type(screen.getByLabelText('Nome'), 'Nova conta')
    await userEvent.selectOptions(
      screen.getByLabelText('Tipo da conta'),
      'credit_card',
    )
    expect(
      screen.getByText('Informe dívidas existentes como valor negativo.'),
    ).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText(/^Saldo inicial/))
    await userEvent.type(screen.getByLabelText(/^Saldo inicial/), '-1.234,56')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar conta' }))
    expect(createAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        initialBalanceMinor: -123456,
        initialBalanceDate: new Date().toLocaleDateString('en-CA'),
      }),
    )
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
