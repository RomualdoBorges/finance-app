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

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    return this.repository.subscribeToAuthState(listener)
  }
}
