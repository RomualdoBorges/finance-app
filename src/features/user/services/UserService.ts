import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../domain/UserProfile'
import type { UserRepository } from '../repositories/UserRepository'

export class UserService {
  private readonly repository: UserRepository

  constructor(repository: UserRepository) {
    this.repository = repository
  }

  ensureUserProfile(user: AuthenticatedUser): Promise<UserProfile> {
    return this.repository.ensureUserProfile(user)
  }

  getUserProfile(uid: string): Promise<UserProfile | null> {
    return this.repository.getUserProfile(uid)
  }

  ensureActiveGroupId(input: {
    readonly userId: string
    readonly groupId: string
  }): Promise<UserProfile> {
    return this.repository.ensureActiveGroupId(input)
  }

  getActiveGroupId(userId: string): Promise<string | null> {
    return this.repository.getActiveGroupId(userId)
  }
}
