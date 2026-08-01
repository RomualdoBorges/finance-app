import type { Firestore } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'

import { GroupError } from '../domain/GroupError'
import {
  FirestoreGroupRepository,
  mapGroupSnapshot,
  type FirestoreGroupOperations,
} from './FirestoreGroupRepository'
import {
  FirestoreMembershipRepository,
  mapMembershipSnapshot,
  type FirestoreMembershipOperations,
} from './FirestoreMembershipRepository'
import {
  FirestorePersonalGroupProvisioningRepository,
  type FirestoreProvisioningOperations,
} from './FirestorePersonalGroupProvisioningRepository'

const date = new Date('2026-01-01T00:00:00Z')
const timestamp = { toDate: () => date }
const groupSnapshot = {
  id: 'group-explicit',
  exists: true,
  data: {
    name: 'Meu Financeiro',
    type: 'personal',
    currency: 'BRL',
    ownerId: 'user-1',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
}
const membershipSnapshot = {
  id: 'user-1',
  exists: true,
  data: {
    groupId: 'group-explicit',
    userId: 'user-1',
    role: 'owner',
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
}
const missing = (id: string) => ({ id, exists: false, data: undefined })

describe('FirestoreGroupRepository', () => {
  it('mapeia o contrato definitivo e busca por groupId explícito', async () => {
    const operations: FirestoreGroupOperations = {
      groupReference: vi.fn().mockReturnValue({}),
      getDocument: vi.fn().mockResolvedValue(groupSnapshot),
    }
    const repository = new FirestoreGroupRepository({} as Firestore, operations)

    await expect(
      repository.getGroupById('group-explicit'),
    ).resolves.toMatchObject({
      id: 'group-explicit',
      ownerId: 'user-1',
      type: 'personal',
      currency: 'BRL',
      status: 'active',
    })
    expect(operations.groupReference).toHaveBeenCalledWith(
      expect.anything(),
      'group-explicit',
    )
  })

  it('rejeita grupo fora do contrato', () => {
    expect(() =>
      mapGroupSnapshot({
        ...groupSnapshot,
        data: { ...groupSnapshot.data, type: 'family' },
      }),
    ).toThrowError(GroupError)
  })
})

describe('FirestoreMembershipRepository', () => {
  it('usa o caminho lógico groupId + userId e mapeia owner ativo', async () => {
    const operations: FirestoreMembershipOperations = {
      membershipReference: vi.fn().mockReturnValue({}),
      getDocument: vi.fn().mockResolvedValue(membershipSnapshot),
    }
    const repository = new FirestoreMembershipRepository(
      {} as Firestore,
      operations,
    )

    await expect(
      repository.getMembership({
        groupId: 'group-explicit',
        userId: 'user-1',
      }),
    ).resolves.toMatchObject({
      groupId: 'group-explicit',
      userId: 'user-1',
      role: 'owner',
      status: 'active',
    })
    expect(operations.membershipReference).toHaveBeenCalledWith(
      expect.anything(),
      'group-explicit',
      'user-1',
    )
  })

  it('rejeita membership com identidade ou papel divergente', () => {
    expect(() =>
      mapMembershipSnapshot({
        ...membershipSnapshot,
        data: { ...membershipSnapshot.data, role: 'admin' },
      }),
    ).toThrowError(GroupError)
  })
})

function createProvisioningRepository(exists: boolean) {
  const get = vi
    .fn()
    .mockResolvedValueOnce(exists ? groupSnapshot : missing('group-explicit'))
    .mockResolvedValueOnce(exists ? membershipSnapshot : missing('user-1'))
  const set = vi.fn()
  const serverTimestamp = vi.fn().mockReturnValue({ serverTimestamp: true })
  const runTransaction: FirestoreProvisioningOperations['runTransaction'] =
    async (_firestore, operation) => {
      await operation({ get, set })
    }
  const operations: FirestoreProvisioningOperations = {
    groupReference: vi.fn().mockReturnValue({ kind: 'group' }),
    membershipReference: vi.fn().mockReturnValue({ kind: 'membership' }),
    runTransaction: vi.fn(runTransaction),
    serverTimestamp,
  }
  return {
    repository: new FirestorePersonalGroupProvisioningRepository(
      {} as Firestore,
      operations,
    ),
    operations,
    set,
    serverTimestamp,
  }
}

describe('FirestorePersonalGroupProvisioningRepository', () => {
  it('cria grupo e membership juntos com IDs explícitos', async () => {
    const { repository, operations, set } = createProvisioningRepository(false)
    await repository.ensurePersonalGroupAndOwner({
      groupId: 'group-explicit',
      userId: 'user-1',
    })

    expect(operations.groupReference).toHaveBeenCalledWith(
      expect.anything(),
      'group-explicit',
    )
    expect(operations.membershipReference).toHaveBeenCalledWith(
      expect.anything(),
      'group-explicit',
      'user-1',
    )
    expect(set).toHaveBeenCalledTimes(2)
    expect(set).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ ownerId: 'user-1', type: 'personal' }),
    )
    expect(set).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        groupId: 'group-explicit',
        userId: 'user-1',
        role: 'owner',
      }),
    )
  })

  it('é idempotente e não atualiza timestamps existentes', async () => {
    const { repository, set, serverTimestamp } =
      createProvisioningRepository(true)
    await repository.ensurePersonalGroupAndOwner({
      groupId: 'group-explicit',
      userId: 'user-1',
    })
    expect(set).not.toHaveBeenCalled()
    expect(serverTimestamp).not.toHaveBeenCalled()
  })
})
