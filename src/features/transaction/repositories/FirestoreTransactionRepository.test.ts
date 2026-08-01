/* eslint-disable @typescript-eslint/require-await */
import { describe, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import {
  FirestoreTransactionRepository,
  RECENT_TRANSACTION_LIMIT,
  type FirestoreTransactionOperations,
} from './FirestoreTransactionRepository'

const timestamp = (date = new Date('2026-07-31T10:00:00Z')) => ({
  toDate: () => date,
})
const input = {
  groupId: 'group-1',
  type: 'expense' as const,
  status: 'pending' as const,
  description: 'Mercado',
  normalizedDescription: 'mercado',
  amountMinor: 15_050,
  accountId: 'account-1',
  categoryId: 'category-1',
  notes: null,
  competenceDate: '2026-07-31',
  dueDate: '2026-08-05',
  paymentDate: '2026-08-05',
  createdBy: 'user-1',
}
const snapshot = {
  id: 'transaction-1',
  exists: true,
  data: { ...input, createdAt: timestamp(), updatedAt: timestamp() },
}
function setup() {
  const ops: FirestoreTransactionOperations = {
    recentQuery: vi.fn(() => 'recent-query'),
    newReference: vi.fn(() => ({
      id: 'transaction-1',
      reference: 'new-reference',
    })),
    get: vi.fn(async () => snapshot),
    list: vi.fn(async () => [snapshot]),
    set: vi.fn(async () => undefined),
    serverTimestamp: vi.fn(() => 'server-time'),
  }
  return {
    ops,
    repository: new FirestoreTransactionRepository({} as Firestore, ops),
  }
}
describe('FirestoreTransactionRepository', () => {
  it('cria no grupo com timestamps de servidor e somente o payload permitido', async () => {
    const { ops, repository } = setup()
    await repository.create(input)
    expect(ops.newReference).toHaveBeenCalledWith(expect.anything(), 'group-1')
    expect(ops.set).toHaveBeenCalledWith('new-reference', {
      ...input,
      createdAt: 'server-time',
      updatedAt: 'server-time',
    })
  })
  it('lista e mapeia a consulta técnica recente', async () => {
    const { ops, repository } = setup()
    await expect(repository.listRecentByGroup('group-1')).resolves.toEqual([
      expect.objectContaining({ id: 'transaction-1', amountMinor: 15_050 }),
    ])
    expect(ops.recentQuery).toHaveBeenCalledWith(expect.anything(), 'group-1')
    expect(RECENT_TRANSACTION_LIMIT).toBe(50)
  })
  it('rejeita documento inválido', async () => {
    const { ops, repository } = setup()
    vi.mocked(ops.list).mockResolvedValue([
      {
        ...snapshot,
        data: { ...snapshot.data, status: 'confirmed', amountMinor: 0 },
      },
    ])
    await expect(repository.listRecentByGroup('group-1')).rejects.toMatchObject(
      { code: 'invalid-data' },
    )
  })
  it('mapeia datas ausentes de documento legado como null', async () => {
    const { ops, repository } = setup()
    const { competenceDate, dueDate, paymentDate, ...legacyInput } = input
    void competenceDate
    void dueDate
    void paymentDate
    vi.mocked(ops.list).mockResolvedValue([
      {
        ...snapshot,
        data: {
          ...legacyInput,
          createdAt: timestamp(),
          updatedAt: timestamp(),
        },
      },
    ])
    await expect(repository.listRecentByGroup('group-1')).resolves.toEqual([
      expect.objectContaining({
        competenceDate: null,
        dueDate: null,
        paymentDate: null,
      }),
    ])
  })
  it('usa pending em memória para status legado ausente', async () => {
    const { ops, repository } = setup()
    const { status, ...legacy } = snapshot.data
    void status
    vi.mocked(ops.list).mockResolvedValue([{ ...snapshot, data: legacy }])
    await expect(repository.listRecentByGroup('group-1')).resolves.toEqual([
      expect.objectContaining({ status: 'pending' }),
    ])
  })
  it('rejeita status persistido inválido', async () => {
    const { ops, repository } = setup()
    vi.mocked(ops.list).mockResolvedValue([
      { ...snapshot, data: { ...snapshot.data, status: 'overdue' } },
    ])
    await expect(repository.listRecentByGroup('group-1')).rejects.toMatchObject(
      { code: 'invalid-data' },
    )
  })
  it.each([
    ['competenceDate', '2026-02-30'],
    ['dueDate', null],
    ['paymentDate', timestamp()],
  ])('rejeita %s presente e inválida', async (field, value) => {
    const { ops, repository } = setup()
    vi.mocked(ops.list).mockResolvedValue([
      { ...snapshot, data: { ...snapshot.data, [field]: value } },
    ])
    await expect(repository.listRecentByGroup('group-1')).rejects.toMatchObject(
      { code: 'invalid-data' },
    )
  })
})
