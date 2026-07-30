import { AuthError } from '../domain/AuthError'
import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import type { AuthRepository } from './AuthRepository'

export class E2EAuthRepository implements AuthRepository {
  private listener: ((user: AuthenticatedUser | null) => void) | undefined
  private user: AuthenticatedUser | null = null

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

  sendPasswordResetEmail(): Promise<void> {
    return Promise.resolve()
  }

  sendVerificationEmail(): Promise<void> {
    return Promise.resolve()
  }

  reloadAuthenticatedUser(): Promise<AuthenticatedUser> {
    if (this.user === null) {
      return Promise.reject(new AuthError('user-not-authenticated'))
    }

    this.user = { ...this.user, emailVerified: true }
    return Promise.resolve(this.user)
  }

  updatePassword(input: {
    readonly currentPassword: string
    readonly newPassword: string
  }): Promise<void> {
    if (this.user === null) {
      return Promise.reject(
        new AuthError('password-update-user-not-authenticated'),
      )
    }

    if (input.currentPassword !== 'senha-atual-valida') {
      return Promise.reject(new AuthError('incorrect-current-password'))
    }

    return Promise.resolve()
  }

  deleteCurrentUser(input: {
    readonly currentPassword: string
  }): Promise<void> {
    if (this.user === null) {
      return Promise.reject(
        new AuthError('account-deletion-user-not-authenticated'),
      )
    }

    if (input.currentPassword === 'sem-rede') {
      return Promise.reject(
        new AuthError('account-deletion-network-unavailable'),
      )
    }

    if (input.currentPassword === 'usuario-inexistente') {
      return Promise.reject(new AuthError('account-deletion-user-not-found'))
    }

    if (input.currentPassword !== 'senha-atual-valida') {
      return Promise.reject(new AuthError('incorrect-current-password'))
    }

    this.user = null
    return Promise.resolve()
  }

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    this.listener = listener
    const authenticated = new URLSearchParams(globalThis.location.search).has(
      'e2e-authenticated',
    )
    const emailVerified = new URLSearchParams(globalThis.location.search).has(
      'e2e-email-verified',
    )
    this.user = authenticated
      ? {
          uid: 'e2e-user',
          email: 'pessoa@example.com',
          displayName: null,
          photoURL: null,
          emailVerified,
        }
      : null
    listener(this.user)
    return () => {
      this.listener = undefined
    }
  }
}
