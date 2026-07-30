import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { PersonalGroup } from '../domain/Group'
import type { GroupRepository } from '../repositories/GroupRepository'

export class GroupService {
  private readonly repository: GroupRepository

  constructor(repository: GroupRepository) {
    this.repository = repository
  }

  ensurePersonalGroup(user: AuthenticatedUser): Promise<PersonalGroup> {
    return this.repository.ensurePersonalGroup(user)
  }
}
