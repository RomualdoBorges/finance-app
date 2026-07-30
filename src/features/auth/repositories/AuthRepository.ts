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

  updatePassword(input: {
    readonly currentPassword: string
    readonly newPassword: string
  }): Promise<void>

  deleteCurrentUser(input: { readonly currentPassword: string }): Promise<void>

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void
}
