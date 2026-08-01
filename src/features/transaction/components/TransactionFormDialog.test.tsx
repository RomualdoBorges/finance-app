import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../../account/domain/Account'
import type { Category } from '../../category/domain/Category'
import { renderWithProviders } from '../../../test/render'
import { TransactionFormDialog } from './TransactionFormDialog'

const account: Account = {
  id: 'account-1',
  groupId: 'group-1',
  name: 'Conta',
  normalizedName: 'conta',
  description: null,
  institutionName: null,
  icon: null,
  color: null,
  accountType: 'checking',
  includeInBalance: true,
  includeInNetWorth: true,
  initialBalanceMinor: 0,
  initialBalanceDate: '2026-07-31',
  currentBalanceMinor: 0,
  projectedBalanceMinor: 0,
  balancesUpdatedAt: null,
  status: 'active',
  isArchived: false,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}
const category: Category = {
  id: 'category-1',
  groupId: 'group-1',
  name: 'Mercado',
  normalizedName: 'mercado',
  type: 'expense',
  origin: 'custom',
  status: 'active',
  parentCategoryId: null,
  icon: null,
  usageCount: 0,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('TransactionFormDialog', () => {
  afterEach(() => vi.useRealTimers())

  it('inicia as três datas no calendário local e envia alterações sem coerção', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date(2026, 6, 31, 23, 59))
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onSubmit = vi.fn(() => Promise.resolve())
    renderWithProviders(
      <TransactionFormDialog
        accounts={[account]}
        categories={[category]}
        pending={false}
        onSubmit={onSubmit}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Novo lançamento' }))
    expect(screen.getByLabelText('Competência')).toHaveValue('2026-07-31')
    expect(screen.getByLabelText('Vencimento')).toHaveValue('2026-07-31')
    expect(screen.getByLabelText('Pagamento')).toHaveValue('2026-07-31')
    expect(screen.getByLabelText('Status')).toHaveValue('pending')
    expect(screen.getByLabelText('Status')).toHaveTextContent('Planejado')
    expect(screen.getByLabelText('Status')).toHaveTextContent('Pendente')
    expect(screen.getByLabelText('Status')).toHaveTextContent('Confirmado')
    expect(screen.getByLabelText('Status')).not.toHaveTextContent('Vencido')
    expect(screen.getByLabelText('Status')).not.toHaveTextContent('Cancelado')

    await user.type(screen.getByLabelText('Descrição'), 'Mercado')
    await user.type(screen.getByLabelText('Valor'), '150,50')
    await user.selectOptions(screen.getByLabelText('Conta'), account.id)
    await user.selectOptions(screen.getByLabelText('Categoria'), category.id)
    await user.clear(screen.getByLabelText('Competência'))
    await user.type(screen.getByLabelText('Competência'), '2026-07-30')
    await user.clear(screen.getByLabelText('Vencimento'))
    await user.type(screen.getByLabelText('Vencimento'), '2026-07-29')
    await user.clear(screen.getByLabelText('Pagamento'))
    await user.type(screen.getByLabelText('Pagamento'), '2026-07-28')
    await user.click(screen.getByRole('button', { name: 'Salvar lançamento' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        competenceDate: '2026-07-30',
        dueDate: '2026-07-29',
        paymentDate: '2026-07-28',
      }),
    )
  })
})
