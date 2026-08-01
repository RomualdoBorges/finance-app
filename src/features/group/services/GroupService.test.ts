import { describe, expect, it, vi } from 'vitest'

import type { UserProfile } from '../../user/domain/UserProfile'
import type { UserRepository } from '../../user/repositories/UserRepository'
import type { FinancialGroup, GroupMembership } from '../domain/Group'
import type { GroupRepository } from '../repositories/GroupRepository'
import type { MembershipRepository } from '../repositories/MembershipRepository'
import type { PersonalGroupProvisioningRepository } from '../repositories/PersonalGroupProvisioningRepository'
import { GroupService, personalGroupIdForUser } from './GroupService'

const timestamp = new Date('2026-01-01T00:00:00Z')
const group: FinancialGroup = {
  id: 'user-1',
  name: 'Meu Financeiro',
  type: 'personal',
  currency: 'BRL',
  ownerId: 'user-1',
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}
const membership: GroupMembership = {
  groupId: 'user-1',
  userId: 'user-1',
  role: 'owner',
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}
const profile: UserProfile = {
  id: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  activeGroupId: 'user-1',
  createdAt: timestamp,
  updatedAt: timestamp,
}

function createService() {
  const ensurePersonalGroupAndOwner = vi.fn().mockResolvedValue(undefined)
  const getGroupById = vi.fn().mockResolvedValue(group)
  const getMembership = vi.fn().mockResolvedValue(membership)
  const ensureActiveGroupId = vi.fn().mockResolvedValue(profile)
  const provisioning: PersonalGroupProvisioningRepository = {
    ensurePersonalGroupAndOwner,
  }
  const groups: GroupRepository = { getGroupById }
  const memberships: MembershipRepository = { getMembership }
  const users: UserRepository = {
    ensureUserProfile: vi.fn(),
    getUserProfile: vi.fn(),
    ensureActiveGroupId,
    getActiveGroupId: vi.fn(),
  }
  return {
    service: new GroupService(provisioning, groups, memberships, users),
    ensurePersonalGroupAndOwner,
    getGroupById,
    getMembership,
    ensureActiveGroupId,
  }
}

describe('GroupService.bootstrapPersonalGroup', () => {
  it('restringe a igualdade UID/grupo à geração do ID pessoal', () => {
    expect(personalGroupIdForUser('user-1')).toBe('user-1')
  })

  it('coordena o bootstrap em ordem e retorna resultado consolidado', async () => {
    const dependencies = createService()
    await expect(
      dependencies.service.bootstrapPersonalGroup({ userId: 'user-1' }),
    ).resolves.toEqual({ group, activeGroup: group, membership, profile })

    expect(dependencies.ensurePersonalGroupAndOwner).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'user-1',
    })
    expect(dependencies.getMembership).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'user-1',
    })
    expect(dependencies.ensureActiveGroupId).toHaveBeenCalledWith({
      userId: 'user-1',
      groupId: 'user-1',
    })
    expect(dependencies.getGroupById).toHaveBeenCalledTimes(2)
    expect(
      dependencies.ensurePersonalGroupAndOwner.mock.invocationCallOrder[0],
    ).toBeLessThan(
      dependencies.ensureActiveGroupId.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it.each(['group', 'membership', 'activeGroupId'] as const)(
    'propaga erro em %s sem repetir operações',
    async (failure) => {
      const dependencies = createService()
      const error = new Error(failure)
      if (failure === 'group') {
        dependencies.getGroupById.mockRejectedValueOnce(error)
      } else if (failure === 'membership') {
        dependencies.getMembership.mockRejectedValueOnce(error)
      } else {
        dependencies.ensureActiveGroupId.mockRejectedValueOnce(error)
      }
      await expect(
        dependencies.service.bootstrapPersonalGroup({ userId: 'user-1' }),
      ).rejects.toBe(error)
      expect(dependencies.ensurePersonalGroupAndOwner).toHaveBeenCalledOnce()
    },
  )
})
