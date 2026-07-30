import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { PersonalGroup } from '../domain/Group'
import type { GroupRepository } from '../repositories/GroupRepository'
import { GroupService } from './GroupService'

describe('GroupService', () => {
  it('delega a garantia do grupo individual ao repository', async () => {
    const user: AuthenticatedUser = {
      uid: 'user-1',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: true,
    }
    const personalGroup = {
      group: {
        id: 'user-1',
        name: 'Meu Financeiro',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      membership: {
        id: 'user-1',
        groupId: 'user-1',
        userId: 'user-1',
        role: 'OWNER',
        createdAt: new Date(),
      },
    } satisfies PersonalGroup
    const ensurePersonalGroup = vi.fn().mockResolvedValue(personalGroup)
    const repository: GroupRepository = {
      ensurePersonalGroup,
      getGroup: vi.fn(),
      getMembership: vi.fn(),
      ensureActiveGroup: vi.fn(),
      getActiveGroup: vi.fn(),
    }

    await expect(
      new GroupService(repository).ensurePersonalGroup(user),
    ).resolves.toBe(personalGroup)
    expect(ensurePersonalGroup).toHaveBeenCalledWith(user)
  })

  it('delega persistência e leitura do grupo ativo', async () => {
    const ensureActiveGroup = vi.fn()
    const getActiveGroup = vi.fn()
    const repository: GroupRepository = {
      ensurePersonalGroup: vi.fn(),
      getGroup: vi.fn(),
      getMembership: vi.fn(),
      ensureActiveGroup,
      getActiveGroup,
    }
    const service = new GroupService(repository)

    await service.ensureActiveGroup('user-1', 'user-1')
    await service.getActiveGroup('user-1')

    expect(ensureActiveGroup).toHaveBeenCalledWith('user-1', 'user-1')
    expect(getActiveGroup).toHaveBeenCalledWith('user-1')
  })
})
