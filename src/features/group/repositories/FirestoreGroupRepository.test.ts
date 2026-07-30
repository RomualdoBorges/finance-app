import type { Firestore } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import { GroupError } from '../domain/GroupError'
import {
  FirestoreGroupRepository,
  type FirestoreGroupOperations,
  mapGroupSnapshot,
  mapMembershipSnapshot,
} from './FirestoreGroupRepository'

const user: AuthenticatedUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  emailVerified: true,
}
const date = new Date('2026-01-01T00:00:00Z')
const timestamp = { toDate: () => date }
const groupSnapshot = {
  id: 'user-1',
  exists: true,
  data: {
    name: 'Meu Financeiro',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
}
const membershipSnapshot = {
  id: 'user-1',
  exists: true,
  data: {
    groupId: 'user-1',
    userId: 'user-1',
    role: 'OWNER',
    createdAt: timestamp,
  },
}

function createRepository(initiallyExists: boolean) {
  const groupReference = { path: 'groups/user-1' }
  const membershipReference = { path: 'groupMembers/user-1' }
  const set = vi.fn()
  const get = vi
    .fn()
    .mockResolvedValueOnce(
      initiallyExists
        ? groupSnapshot
        : { id: 'user-1', exists: false, data: undefined },
    )
    .mockResolvedValueOnce(
      initiallyExists
        ? membershipSnapshot
        : { id: 'user-1', exists: false, data: undefined },
    )
  const runGroupTransaction: FirestoreGroupOperations['runTransaction'] =
    async (_firestore, operation) => {
      await operation({ get, set })
    }
  const operations: FirestoreGroupOperations = {
    groupReference: vi.fn().mockReturnValue(groupReference),
    membershipReference: vi.fn().mockReturnValue(membershipReference),
    getDocument: vi
      .fn()
      .mockResolvedValueOnce(groupSnapshot)
      .mockResolvedValueOnce(membershipSnapshot),
    runTransaction: vi.fn(runGroupTransaction),
    serverTimestamp: vi.fn().mockReturnValue({ serverTimestamp: true }),
  }
  return {
    repository: new FirestoreGroupRepository({} as Firestore, operations),
    operations,
    set,
    groupReference,
    membershipReference,
  }
}

describe('mapeamento de grupo individual', () => {
  it('materializa grupo e membership OWNER', () => {
    expect(mapGroupSnapshot(groupSnapshot)).toMatchObject({
      id: 'user-1',
      name: 'Meu Financeiro',
      createdAt: date,
    })
    expect(mapMembershipSnapshot(membershipSnapshot)).toMatchObject({
      id: 'user-1',
      groupId: 'user-1',
      userId: 'user-1',
      role: 'OWNER',
      createdAt: date,
    })
  })

  it('rejeita documentos fora do contrato', () => {
    expect(() =>
      mapMembershipSnapshot({
        ...membershipSnapshot,
        data: { ...membershipSnapshot.data, role: 'MEMBER' },
      }),
    ).toThrowError(GroupError)
  })
})

describe('FirestoreGroupRepository', () => {
  it('cria ambos os documentos ausentes com IDs determinísticos', async () => {
    const { repository, set, groupReference, membershipReference, operations } =
      createRepository(false)

    await expect(repository.ensurePersonalGroup(user)).resolves.toMatchObject({
      group: { id: 'user-1' },
      membership: { id: 'user-1', role: 'OWNER' },
    })

    expect(set).toHaveBeenCalledTimes(2)
    expect(set).toHaveBeenNthCalledWith(
      1,
      groupReference,
      expect.objectContaining({ name: 'Meu Financeiro' }),
    )
    expect(set).toHaveBeenNthCalledWith(
      2,
      membershipReference,
      expect.objectContaining({
        groupId: 'user-1',
        userId: 'user-1',
        role: 'OWNER',
      }),
    )
    expect(operations.groupReference).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
    )
  })

  it('não escreve nem atualiza timestamps quando ambos já existem', async () => {
    const { repository, set, operations } = createRepository(true)

    await repository.ensurePersonalGroup(user)

    expect(set).not.toHaveBeenCalled()
    expect(operations.serverTimestamp).not.toHaveBeenCalled()
  })
})
