import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../domain/UserProfile'
import { UserProfileError } from '../domain/UserProfileError'
import type { UserRepository } from './UserRepository'

export class E2EUserRepository implements UserRepository {
  private profiles = new Map<string, UserProfile>()
  private shouldFailOnce = new URLSearchParams(globalThis.location.search).has(
    'e2e-profile-error',
  )

  ensureUserProfile(user: AuthenticatedUser): Promise<UserProfile> {
    if (this.shouldFailOnce) {
      this.shouldFailOnce = false
      return Promise.reject(new UserProfileError('unavailable'))
    }

    const existing = this.profiles.get(user.uid)
    if (
      existing !== undefined &&
      existing.email === user.email &&
      existing.displayName === user.displayName &&
      existing.photoURL === user.photoURL
    ) {
      return Promise.resolve(existing)
    }

    const timestamp = existing?.createdAt ?? new Date('2026-01-01T00:00:00Z')
    const profile: UserProfile = {
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: timestamp,
      updatedAt:
        existing === undefined ? timestamp : new Date('2026-01-02T00:00:00Z'),
    }
    this.profiles.set(user.uid, profile)
    return Promise.resolve(profile)
  }

  getUserProfile(uid: string): Promise<UserProfile | null> {
    return Promise.resolve(this.profiles.get(uid) ?? null)
  }
}
