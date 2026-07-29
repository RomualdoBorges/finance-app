import { AuthError } from '../domain/AuthError'
import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import type { AuthRepository } from './AuthRepository'

export class E2EAuthRepository implements AuthRepository {
  registerWithEmailAndPassword(): Promise<AuthenticatedUser> {
    return Promise.reject(new AuthError('unknown'))
  }

  signInWithEmailAndPassword(): Promise<AuthenticatedUser> {
    return Promise.reject(new AuthError('unknown'))
  }

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    listener(null)
    return () => undefined
  }
}
