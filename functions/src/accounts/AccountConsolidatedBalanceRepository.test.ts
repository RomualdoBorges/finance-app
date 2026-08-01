import { describe, expect, it, vi } from 'vitest'

import {
  FirebaseAdminAccountConsolidatedBalanceRepository,
  type AccountConsolidatedBalanceOperations,
} from './AccountConsolidatedBalanceRepository.js'

describe('FirebaseAdminAccountConsolidatedBalanceRepository', () => {
  it('escreve somente o trio consolidado com timestamp confiável', async () => {
    const update = vi.fn(async () => undefined)
    const operations: AccountConsolidatedBalanceOperations = {
      update,
      serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    }
    const repository =
      new FirebaseAdminAccountConsolidatedBalanceRepository(operations)

    await repository.updateAccountConsolidatedBalances('group-1', 'account-1', {
      currentBalanceMinor: 12500,
      projectedBalanceMinor: 15000,
    })

    expect(update).toHaveBeenCalledWith(
      'financialGroups/group-1/accounts/account-1',
      {
        currentBalanceMinor: 12500,
        projectedBalanceMinor: 15000,
        balancesUpdatedAt: 'SERVER_TIMESTAMP',
      },
    )
  })

  it('valida identificadores, inteiros e limites antes de escrever', async () => {
    const update = vi.fn(async () => undefined)
    const repository = new FirebaseAdminAccountConsolidatedBalanceRepository({
      update,
      serverTimestamp: vi.fn(),
    })

    for (const [groupId, accountId, snapshot] of [
      ['', 'account-1', { currentBalanceMinor: 0, projectedBalanceMinor: 0 }],
      ['group-1', 'account/1', { currentBalanceMinor: 0, projectedBalanceMinor: 0 }],
      ['group-1', 'account-1', { currentBalanceMinor: 1.5, projectedBalanceMinor: 0 }],
      ['group-1', 'account-1', { currentBalanceMinor: 0, projectedBalanceMinor: 9_000_000_000_001 }],
    ] as const) {
      await expect(
        repository.updateAccountConsolidatedBalances(
          groupId,
          accountId,
          snapshot,
        ),
      ).rejects.toBeInstanceOf(Error)
    }
    expect(update).not.toHaveBeenCalled()
  })
})
