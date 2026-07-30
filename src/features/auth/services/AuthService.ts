import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import type { AuthRepository } from '../repositories/AuthRepository'

export class AuthService {
  private readonly repository: AuthRepository

  constructor(repository: AuthRepository) {
    this.repository = repository
  }

  registerWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    return this.repository.registerWithEmailAndPassword(email, password)
  }

  signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    return this.repository.signInWithEmailAndPassword(email, password)
  }

  signOut(): Promise<void> {
    return this.repository.signOut()
  }

  sendPasswordResetEmail(email: string): Promise<void> {
    return this.repository.sendPasswordResetEmail(email)
  }

  sendVerificationEmail(): Promise<void> {
    return this.repository.sendVerificationEmail()
  }

  reloadAuthenticatedUser(): Promise<AuthenticatedUser> {
    return this.repository.reloadAuthenticatedUser()
  }

  updatePassword(input: {
    readonly currentPassword: string
    readonly newPassword: string
  }): Promise<void> {
    return this.repository.updatePassword(input)
  }

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    return this.repository.subscribeToAuthState(listener)
  }
}
