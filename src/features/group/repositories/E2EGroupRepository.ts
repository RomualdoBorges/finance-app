import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../../user/domain/UserProfile'
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
  private readonly profiles = new Map<string, UserProfile>()

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

  ensureActiveGroup(userId: string, groupId: string): Promise<UserProfile> {
    const existing = this.profiles.get(userId)
    const timestamp = new Date('2026-01-01T00:00:00Z')
    const profile: UserProfile = existing ?? {
      id: userId,
      email: null,
      displayName: null,
      photoURL: null,
      activeGroupId: groupId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.profiles.set(userId, profile)
    return Promise.resolve(profile)
  }

  getActiveGroup(userId: string): Promise<Group | null> {
    const activeGroupId = this.profiles.get(userId)?.activeGroupId
    return Promise.resolve(
      activeGroupId === null || activeGroupId === undefined
        ? null
        : (this.groups.get(activeGroupId) ?? null),
    )
  }
}
