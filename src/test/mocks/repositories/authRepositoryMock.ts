import { vi, type Mocked } from 'vitest'

import type { AuthRepository } from '../../../features/auth/repositories/AuthRepository'

export function createAuthRepositoryMock(): Mocked<AuthRepository> {
  return {
    registerWithEmailAndPassword:
      vi.fn<AuthRepository['registerWithEmailAndPassword']>(),
    signInWithEmailAndPassword:
      vi.fn<AuthRepository['signInWithEmailAndPassword']>(),
    signOut: vi.fn<AuthRepository['signOut']>(),
    sendPasswordResetEmail:
      vi.fn<AuthRepository['sendPasswordResetEmail']>(),
    subscribeToAuthState: vi.fn<AuthRepository['subscribeToAuthState']>(),
  }
}
