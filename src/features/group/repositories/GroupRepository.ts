import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../../user/domain/UserProfile'
import type { Group, GroupMember, PersonalGroup } from '../domain/Group'

export interface GroupRepository {
  ensurePersonalGroup(user: AuthenticatedUser): Promise<PersonalGroup>
  getGroup(groupId: string): Promise<Group | null>
  getMembership(userId: string): Promise<GroupMember | null>
  ensureActiveGroup(userId: string, groupId: string): Promise<UserProfile>
  getActiveGroup(userId: string): Promise<Group | null>
}
