import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import {
  PERSONAL_GROUP_NAME,
  type Group,
  type GroupMember,
  type PersonalGroup,
} from '../domain/Group'
import type { GroupRepository } from './GroupRepository'

export class E2EGroupRepository implements GroupRepository {
  private readonly groups = new Map<string, Group>()
  private readonly memberships = new Map<string, GroupMember>()

  ensurePersonalGroup(user: AuthenticatedUser): Promise<PersonalGroup> {
    const createdAt = new Date('2026-01-01T00:00:00Z')
    const group = this.groups.get(user.uid) ?? {
      id: user.uid,
      name: PERSONAL_GROUP_NAME,
      createdAt,
      updatedAt: createdAt,
    }
    const membership = this.memberships.get(user.uid) ?? {
      id: user.uid,
      groupId: user.uid,
      userId: user.uid,
      role: 'OWNER' as const,
      createdAt,
    }
    this.groups.set(user.uid, group)
    this.memberships.set(user.uid, membership)
    return Promise.resolve({ group, membership })
  }

  getGroup(groupId: string): Promise<Group | null> {
    return Promise.resolve(this.groups.get(groupId) ?? null)
  }

  getMembership(userId: string): Promise<GroupMember | null> {
    return Promise.resolve(this.memberships.get(userId) ?? null)
  }
}
