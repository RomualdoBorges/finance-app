/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment -- adaptadores assíncronos e capturas dinâmicas simulam a API modular do Firestore */
import { describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import {
  FirestoreAccountRepository,
  type FirestoreAccountOperations,
} from './FirestoreAccountRepository'

const timestamp = { toDate: () => new Date('2026-01-01T00:00:00Z') }
const data = {
  groupId: 'g1',
  name: 'Conta',
  normalizedName: 'conta',
  description: null,
  institutionName: null,
  icon: null,
  color: null,
  accountType: 'checking',
  includeInBalance: true,
  includeInNetWorth: true,
  initialBalanceMinor: 123456,
  initialBalanceDate: '2026-07-31',
  currentBalanceMinor: 120000,
  projectedBalanceMinor: 125000,
  balancesUpdatedAt: timestamp,
  status: 'active',
  isArchived: false,
  createdBy: 'u1',
  createdAt: timestamp,
  updatedAt: timestamp,
}

describe('FirestoreAccountRepository', () => {
  it('usa path, timestamps do servidor e atualizações mínimas', async () => {
    let stored = data
    const set = vi.fn(async (_ref, value) => {
      stored = { ...data, ...value, createdAt: timestamp, updatedAt: timestamp }
    })
    const update = vi.fn(async (_ref, value) => {
      stored = { ...stored, ...value, updatedAt: timestamp }
    })
    const ops: FirestoreAccountOperations = {
      collection: vi.fn(() => 'financialGroups/g1/accounts'),
      reference: vi.fn((_db, groupId, accountId) => `${groupId}/${accountId}`),
      newReference: vi.fn(() => ({ id: 'a1', reference: 'g1/a1' })),
      get: vi.fn(async () => ({ id: 'a1', exists: true, data: stored })),
      list: vi.fn(async () => [{ id: 'a1', exists: true, data: stored }]),
      set,
      update,
      serverTimestamp: vi.fn(() => 'SERVER'),
    }
    const repository = new FirestoreAccountRepository({} as Firestore, ops)
    await repository.create({
      groupId: 'g1',
      name: 'Conta',
      normalizedName: 'conta',
      description: null,
      institutionName: null,
      icon: null,
      color: null,
      accountType: 'checking',
      includeInBalance: true,
      includeInNetWorth: true,
      initialBalanceMinor: 123456,
      initialBalanceDate: '2026-07-31',
      status: 'active',
      isArchived: false,
      createdBy: 'u1',
    })
    expect(set).toHaveBeenCalledWith(
      'g1/a1',
      expect.not.objectContaining({
        currentBalanceMinor: expect.anything(),
        projectedBalanceMinor: expect.anything(),
        balancesUpdatedAt: expect.anything(),
      }),
    )
    await repository.update('g1', 'a1', {
      name: 'Nova',
      normalizedName: 'nova',
      description: null,
      institutionName: null,
      icon: null,
      color: null,
      accountType: 'investment',
      includeInBalance: false,
      includeInNetWorth: true,
      initialBalanceMinor: -2500,
      initialBalanceDate: '2026-07-30',
    })
    expect(update).toHaveBeenLastCalledWith(
      'g1/a1',
      expect.not.objectContaining({
        createdBy: expect.anything(),
        createdAt: expect.anything(),
        currentBalanceMinor: expect.anything(),
        projectedBalanceMinor: expect.anything(),
        balancesUpdatedAt: expect.anything(),
      }),
    )
    await repository.setArchived('g1', 'a1', true)
    expect(update).toHaveBeenLastCalledWith('g1/a1', {
      status: 'archived',
      isArchived: true,
      updatedAt: 'SERVER',
    })
    expect(stored).toMatchObject({
      currentBalanceMinor: 120000,
      projectedBalanceMinor: 125000,
      balancesUpdatedAt: timestamp,
    })
  })

  it('aplica fallback de outra conta ao ler documento legado', async () => {
    const legacy = { ...data } as Partial<typeof data>
    delete legacy.accountType
    delete legacy.includeInBalance
    delete legacy.includeInNetWorth
    delete legacy.initialBalanceMinor
    delete legacy.initialBalanceDate
    delete legacy.currentBalanceMinor
    delete legacy.projectedBalanceMinor
    delete legacy.balancesUpdatedAt
    const ops = {
      collection: vi.fn(() => 'accounts'),
      reference: vi.fn(),
      newReference: vi.fn(),
      get: vi.fn(),
      list: vi.fn(async () => [{ id: 'legacy', exists: true, data: legacy }]),
      set: vi.fn(),
      update: vi.fn(),
      serverTimestamp: vi.fn(),
    } as unknown as FirestoreAccountOperations
    const [account] = await new FirestoreAccountRepository(
      {} as Firestore,
      ops,
    ).listByGroup('g1')
    expect(account).toMatchObject({
      accountType: 'other',
      includeInBalance: true,
      includeInNetWorth: true,
      initialBalanceMinor: 0,
      initialBalanceDate: null,
      currentBalanceMinor: 0,
      projectedBalanceMinor: 0,
      balancesUpdatedAt: null,
    })
  })

  it('usa o saldo inicial normalizado como fallback do trio consolidado', async () => {
    const legacy = { ...data }
    delete (legacy as Partial<typeof data>).currentBalanceMinor
    delete (legacy as Partial<typeof data>).projectedBalanceMinor
    delete (legacy as Partial<typeof data>).balancesUpdatedAt
    const ops = {
      collection: vi.fn(() => 'accounts'),
      list: vi.fn(async () => [{ id: 'legacy', exists: true, data: legacy }]),
    } as unknown as FirestoreAccountOperations
    const [account] = await new FirestoreAccountRepository(
      {} as Firestore,
      ops,
    ).listByGroup('g1')
    expect(account).toMatchObject({
      currentBalanceMinor: 123456,
      projectedBalanceMinor: 123456,
      balancesUpdatedAt: null,
    })
  })

  it('rejeita presença parcial ou valores inválidos do trio consolidado', async () => {
    for (const invalid of [
      { ...data, projectedBalanceMinor: undefined },
      { ...data, balancesUpdatedAt: undefined },
      { ...data, currentBalanceMinor: 1.5 },
    ]) {
      const ops = {
        collection: vi.fn(() => 'accounts'),
        list: vi.fn(async () => [
          { id: 'invalid', exists: true, data: invalid },
        ]),
      } as unknown as FirestoreAccountOperations
      await expect(
        new FirestoreAccountRepository({} as Firestore, ops).listByGroup('g1'),
      ).rejects.toMatchObject({ code: 'invalid-data' })
    }
  })
})
