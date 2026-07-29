import { AuthError } from '../domain/AuthError'
import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import type { AuthRepository } from './AuthRepository'

export class E2EAuthRepository implements AuthRepository {
  private listener: ((user: AuthenticatedUser | null) => void) | undefined

  registerWithEmailAndPassword(): Promise<AuthenticatedUser> {
    return Promise.reject(new AuthError('unknown'))
  }

  signInWithEmailAndPassword(): Promise<AuthenticatedUser> {
    return Promise.reject(new AuthError('unknown'))
  }

  signOut(): Promise<void> {
    this.listener?.(null)
    return Promise.resolve()
  }

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    this.listener = listener
    const authenticated = new URLSearchParams(globalThis.location.search).has(
      'e2e-authenticated',
    )
    listener(
      authenticated
        ? {
            uid: 'e2e-user',
            email: null,
            displayName: null,
            photoURL: null,
            emailVerified: false,
          }
        : null,
    )
    return () => {
      this.listener = undefined
    }
  }
}
