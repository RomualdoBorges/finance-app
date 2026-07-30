import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import type { UserProfile } from '../domain/UserProfile'
import { UserProfileError } from '../domain/UserProfileError'
import type { UserRepository } from '../repositories/UserRepository'
import { UserService } from './UserService'

const user: AuthenticatedUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  emailVerified: true,
}
const profile: UserProfile = {
  id: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  activeGroupId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
}

function createRepository() {
  const ensureUserProfile = vi.fn().mockResolvedValue(profile)
  const getUserProfile = vi.fn().mockResolvedValue(profile)
  const repository: UserRepository = { ensureUserProfile, getUserProfile }
  return { repository, ensureUserProfile, getUserProfile }
}

describe('UserService', () => {
  it('delega ensure e get com seus retornos', async () => {
    const { repository, ensureUserProfile, getUserProfile } = createRepository()
    const service = new UserService(repository)

    await expect(service.ensureUserProfile(user)).resolves.toBe(profile)
    await expect(service.getUserProfile('user-1')).resolves.toBe(profile)
    expect(ensureUserProfile).toHaveBeenCalledWith(user)
    expect(getUserProfile).toHaveBeenCalledWith('user-1')
  })

  it('propaga erro sanitizado', async () => {
    const { repository, ensureUserProfile } = createRepository()
    const error = new UserProfileError('unavailable')
    ensureUserProfile.mockRejectedValue(error)

    await expect(
      new UserService(repository).ensureUserProfile(user),
    ).rejects.toBe(error)
  })
})
