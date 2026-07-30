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

  signOut(): Promise<void>

  sendPasswordResetEmail(email: string): Promise<void>

  sendVerificationEmail(): Promise<void>

  reloadAuthenticatedUser(): Promise<AuthenticatedUser>

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void
}
