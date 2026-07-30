import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../domain/UserProfile'

export interface UserRepository {
  ensureUserProfile(user: AuthenticatedUser): Promise<UserProfile>
  getUserProfile(uid: string): Promise<UserProfile | null>
}
