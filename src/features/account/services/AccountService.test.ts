/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method -- mocks estruturais do repository são inspecionados como spies do Vitest */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Account } from '../domain/Account'
import type { AccountRepository } from '../repositories/AccountRepository'
import { AccountService } from './AccountService'

const now = new Date('2026-01-01T00:00:00Z')
const base = (overrides: Partial<Account> = {}): Account => ({
  id: 'a1',
  groupId: 'g1',
  name: 'Principal',
  normalizedName: 'principal',
  description: null,
  institutionName: null,
  icon: null,
  color: null,
  accountType: 'other',
  includeInBalance: true,
  includeInNetWorth: true,
  initialBalanceMinor: 0,
  initialBalanceDate: '2026-01-01',
  currentBalanceMinor: 0,
  projectedBalanceMinor: 0,
  balancesUpdatedAt: null,
  status: 'active',
  isArchived: false,
  createdBy: 'u1',
  createdAt: now,
  updatedAt: now,
  ...overrides,
})

describe('AccountService', () => {
  let accounts: Account[]
  let repository: AccountRepository
  let service: AccountService
  beforeEach(() => {
    accounts = []
    repository = {
      listByGroup: vi.fn(async () => accounts),
      create: vi.fn(async (input) => base({ ...input, id: 'created' })),
      update: vi.fn(async (_groupId, accountId, input) =>
        base({ ...input, id: accountId }),
      ),
      setArchived: vi.fn(async () => undefined),
    }
    service = new AccountService(repository)
  })
  it('cria ativa com contexto e nome normalizado', async () => {
    await service.createAccount(
      { groupId: 'g1', userId: 'u1' },
      {
        name: '  Conta Ágil ',
        description: null,
        institutionName: null,
        icon: null,
        color: null,
        accountType: 'credit_card',
        includeInBalance: false,
        includeInNetWorth: true,
        initialBalanceMinor: -12345,
        initialBalanceDate: '2025-12-31',
      },
    )
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'g1',
        createdBy: 'u1',
        normalizedName: 'conta agil',
        status: 'active',
        isArchived: false,
        accountType: 'credit_card',
        includeInBalance: false,
        includeInNetWorth: true,
      }),
    )
    expect(repository.create).toHaveBeenCalledWith(
      expect.not.objectContaining({
        currentBalanceMinor: expect.anything(),
        projectedBalanceMinor: expect.anything(),
        balancesUpdatedAt: expect.anything(),
      }),
    )
  })
  it('rejeita duplicidade ativa, mas ignora arquivada na criação', async () => {
    accounts = [base()]
    await expect(
      service.createAccount(
        { groupId: 'g1', userId: 'u1' },
        {
          name: 'PRINCIPAL',
          description: null,
          institutionName: null,
          icon: null,
          color: null,
          accountType: 'other',
          includeInBalance: true,
          includeInNetWorth: true,
          initialBalanceMinor: 0,
          initialBalanceDate: '2026-01-01',
        },
      ),
    ).rejects.toMatchObject({ code: 'duplicate' })
    accounts = [base({ status: 'archived', isArchived: true })]
    await expect(
      service.createAccount(
        { groupId: 'g1', userId: 'u1' },
        {
          name: 'Principal',
          description: null,
          institutionName: null,
          icon: null,
          color: null,
          accountType: 'other',
          includeInBalance: true,
          includeInNetWorth: true,
          initialBalanceMinor: 0,
          initialBalanceDate: '2026-01-01',
        },
      ),
    ).resolves.toBeDefined()
  })
  it('edita apenas dados mutáveis', async () => {
    accounts = [base()]
    await service.updateAccount(
      { groupId: 'g1', userId: 'u1' },
      {
        accountId: 'a1',
        name: 'Nova',
        description: 'D',
        institutionName: 'B',
        icon: null,
        color: null,
        accountType: 'investment',
        includeInBalance: true,
        includeInNetWorth: false,
        initialBalanceMinor: 5000,
        initialBalanceDate: '2025-12-31',
      },
    )
    expect(repository.update).toHaveBeenCalledWith(
      'g1',
      'a1',
      expect.objectContaining({
        name: 'Nova',
        normalizedName: 'nova',
        accountType: 'investment',
        includeInBalance: true,
        includeInNetWorth: false,
      }),
    )
    expect(repository.update).toHaveBeenCalledWith(
      'g1',
      'a1',
      expect.not.objectContaining({
        currentBalanceMinor: expect.anything(),
        projectedBalanceMinor: expect.anything(),
        balancesUpdatedAt: expect.anything(),
      }),
    )
  })
  it('arquiva e restaura de modo idempotente', async () => {
    accounts = [base({ status: 'archived', isArchived: true })]
    await service.archiveAccount(
      { groupId: 'g1', userId: 'u1' },
      { accountId: 'a1' },
    )
    expect(repository.setArchived).not.toHaveBeenCalled()
    await service.restoreAccount(
      { groupId: 'g1', userId: 'u1' },
      { accountId: 'a1' },
    )
    expect(repository.setArchived).toHaveBeenCalledWith('g1', 'a1', false)
  })
  it('bloqueia restauração com nome ativo duplicado', async () => {
    accounts = [
      base({ status: 'archived', isArchived: true }),
      base({ id: 'a2' }),
    ]
    await expect(
      service.restoreAccount(
        { groupId: 'g1', userId: 'u1' },
        { accountId: 'a1' },
      ),
    ).rejects.toMatchObject({ code: 'duplicate' })
  })
})
