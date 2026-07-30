import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../../user/domain/UserProfile'
import type { Group, PersonalGroup } from '../domain/Group'
import type { GroupRepository } from '../repositories/GroupRepository'

export class GroupService {
  private readonly repository: GroupRepository

  constructor(repository: GroupRepository) {
    this.repository = repository
  }

  ensurePersonalGroup(user: AuthenticatedUser): Promise<PersonalGroup> {
    return this.repository.ensurePersonalGroup(user)
  }

  ensureActiveGroup(userId: string, groupId: string): Promise<UserProfile> {
    return this.repository.ensureActiveGroup(userId, groupId)
  }

  getActiveGroup(userId: string): Promise<Group | null> {
    return this.repository.getActiveGroup(userId)
  }
}
