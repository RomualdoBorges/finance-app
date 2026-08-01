/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-return */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccountRepository } from '../../account/repositories/AccountRepository'
import type { CategoryRepository } from '../../category/repositories/CategoryRepository'
import type { TransactionRepository } from '../repositories/TransactionRepository'
import { TransactionError } from '../domain/TransactionError'
import { TransactionService } from './TransactionService'

const account = {
  id: 'account-1',
  groupId: 'group-1',
  name: 'Conta',
  normalizedName: 'conta',
  description: null,
  institutionName: null,
  icon: null,
  color: null,
  accountType: 'checking' as const,
  includeInBalance: true,
  includeInNetWorth: true,
  initialBalanceMinor: 0,
  initialBalanceDate: '2026-01-01',
  currentBalanceMinor: 0,
  projectedBalanceMinor: 0,
  balancesUpdatedAt: null,
  status: 'active' as const,
  isArchived: false,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}
const category = {
  id: 'category-1',
  groupId: 'group-1',
  name: 'Salário',
  normalizedName: 'salario',
  type: 'income' as const,
  origin: 'default' as const,
  status: 'active' as const,
  parentCategoryId: null,
  icon: null,
  usageCount: 0,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}
const input = {
  type: 'income' as const,
  status: 'pending' as const,
  description: ' Salário mensal ',
  amountMinor: 100_000,
  accountId: account.id,
  categoryId: category.id,
  notes: '  Julho  ',
  competenceDate: '2026-07-31',
  dueDate: '2026-08-05',
  paymentDate: '2026-08-05',
}
describe('TransactionService', () => {
  const repository = { create: vi.fn(), listRecentByGroup: vi.fn() }
  const accounts = { listByGroup: vi.fn() } as unknown as AccountRepository
  const categories = { getById: vi.fn() } as unknown as CategoryRepository
  const service = new TransactionService(
    repository as unknown as TransactionRepository,
    accounts,
    categories,
  )
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(accounts.listByGroup).mockResolvedValue([account])
    vi.mocked(categories.getById).mockResolvedValue(category)
    repository.create.mockImplementation(async (value) => ({
      ...value,
      id: 'transaction-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  })
  it('cria receita positiva sem campos posteriores nem alteração de saldo', async () => {
    await service.createTransaction(
      { groupId: 'group-1', userId: 'user-1' },
      input,
    )
    expect(repository.create).toHaveBeenCalledWith({
      groupId: 'group-1',
      createdBy: 'user-1',
      type: 'income',
      status: 'pending',
      description: 'Salário mensal',
      normalizedDescription: 'salario mensal',
      amountMinor: 100_000,
      accountId: 'account-1',
      categoryId: 'category-1',
      notes: 'Julho',
      competenceDate: '2026-07-31',
      dueDate: '2026-08-05',
      paymentDate: '2026-08-05',
      operationKind: 'normal',
      confirmedAt: null,
      confirmedBy: null,
      canceledAt: null,
      canceledBy: null,
      cancellationReason: null,
      reversalOfTransactionId: null,
      refundOfTransactionId: null,
      reversedByTransactionId: null,
      refundedByTransactionId: null,
    })
    expect(accounts.listByGroup).toHaveBeenCalledTimes(1)
  })
  it('rejeita data civil inexistente sem criar no repository', async () => {
    await expect(
      service.createTransaction(
        { groupId: 'group-1', userId: 'user-1' },
        { ...input, paymentDate: '2026-02-30' },
      ),
    ).rejects.toMatchObject({ code: 'invalid-input' })
    expect(repository.create).not.toHaveBeenCalled()
  })
  it('cria despesa com categoria compatível', async () => {
    vi.mocked(categories.getById).mockResolvedValue({
      ...category,
      type: 'expense',
    })
    await service.createTransaction(
      { groupId: 'group-1', userId: 'user-1' },
      { ...input, type: 'expense' },
    )
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'expense', amountMinor: 100_000 }),
    )
  })
  it('rejeita conta inexistente ou arquivada', async () => {
    vi.mocked(accounts.listByGroup).mockResolvedValue([])
    await expect(
      service.createTransaction(
        { groupId: 'group-1', userId: 'user-1' },
        input,
      ),
    ).rejects.toMatchObject({ code: 'account-not-found' })
    vi.mocked(accounts.listByGroup).mockResolvedValue([
      { ...account, isArchived: true, status: 'archived' },
    ])
    await expect(
      service.createTransaction(
        { groupId: 'group-1', userId: 'user-1' },
        input,
      ),
    ).rejects.toMatchObject({ code: 'account-archived' })
  })
  it('rejeita categoria inexistente, arquivada ou incompatível', async () => {
    vi.mocked(categories.getById).mockResolvedValue(null)
    await expect(
      service.createTransaction(
        { groupId: 'group-1', userId: 'user-1' },
        input,
      ),
    ).rejects.toBeInstanceOf(TransactionError)
    vi.mocked(categories.getById).mockResolvedValue({
      ...category,
      status: 'archived',
    })
    await expect(
      service.createTransaction(
        { groupId: 'group-1', userId: 'user-1' },
        input,
      ),
    ).rejects.toMatchObject({ code: 'category-archived' })
    vi.mocked(categories.getById).mockResolvedValue({
      ...category,
      type: 'expense',
    })
    await expect(
      service.createTransaction(
        { groupId: 'group-1', userId: 'user-1' },
        input,
      ),
    ).rejects.toMatchObject({ code: 'category-type-mismatch' })
  })
})
