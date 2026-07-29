import type { AuthenticatedUser } from '../domain/AuthenticatedUser'

export interface AuthRepository {
  registerWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser>

  signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser>

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void
}
