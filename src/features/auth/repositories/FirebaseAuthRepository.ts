import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reload,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type Auth,
  type AuthCredential,
  type User,
  type UserCredential,
} from 'firebase/auth'

import { AuthError, type AuthErrorCode } from '../domain/AuthError'
import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import type {
  SensitiveAction,
  SensitiveOperation,
} from '../domain/SensitiveAction'
import type { AuthRepository } from './AuthRepository'

type FirebaseAuthOperations = {
  readonly createUser: (
    auth: Auth,
    email: string,
    password: string,
  ) => Promise<UserCredential>
  readonly signIn: (
    auth: Auth,
    email: string,
    password: string,
  ) => Promise<UserCredential>
  readonly signOut: (auth: Auth) => Promise<void>
  readonly sendPasswordResetEmail: (auth: Auth, email: string) => Promise<void>
  readonly sendEmailVerification: (user: User) => Promise<void>
  readonly reload: (user: User) => Promise<void>
  readonly createEmailCredential: (
    email: string,
    password: string,
  ) => AuthCredential
  readonly reauthenticate: (
    user: User,
    credential: AuthCredential,
  ) => Promise<UserCredential>
  readonly updatePassword: (user: User, newPassword: string) => Promise<void>
  readonly deleteUser: (user: User) => Promise<void>
  readonly subscribe: (
    auth: Auth,
    listener: (user: User | null) => void,
  ) => () => void
}

const defaultOperations: FirebaseAuthOperations = {
  createUser: createUserWithEmailAndPassword,
  signIn: signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  createEmailCredential: (email, password) =>
    EmailAuthProvider.credential(email, password),
  reauthenticate: reauthenticateWithCredential,
  updatePassword,
  deleteUser,
  subscribe: onAuthStateChanged,
}

export function mapFirebaseUser(user: User): AuthenticatedUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
  }
}

const firebaseErrorCodes: Readonly<Record<string, AuthErrorCode>> = {
  'auth/invalid-email': 'invalid-email',
  'auth/weak-password': 'weak-password',
  'auth/email-already-in-use': 'email-already-in-use',
  'auth/invalid-credential': 'invalid-credentials',
  'auth/invalid-login-credentials': 'invalid-credentials',
  'auth/user-not-found': 'invalid-credentials',
  'auth/wrong-password': 'invalid-credentials',
  'auth/user-disabled': 'user-disabled',
  'auth/too-many-requests': 'too-many-requests',
  'auth/network-request-failed': 'network-unavailable',
}

export function mapFirebaseAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error

  const firebaseCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined

  return new AuthError(
    firebaseCode === undefined
      ? 'unknown'
      : (firebaseErrorCodes[firebaseCode] ?? 'unknown'),
  )
}

function getFirebaseErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : undefined
}

function mapPasswordUpdateError(error: unknown): AuthError {
  const code = getFirebaseErrorCode(error)

  if (code === 'auth/wrong-password') {
    return new AuthError('incorrect-current-password')
  }

  if (code === 'auth/invalid-credential') {
    return new AuthError('current-credential-invalid')
  }

  if (
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/user-mismatch'
  ) {
    return new AuthError('current-credential-invalid')
  }

  if (code === 'auth/requires-recent-login') {
    return new AuthError('recent-login-required')
  }

  if (code === 'auth/weak-password') {
    return new AuthError('password-update-weak-password')
  }

  if (code === 'auth/too-many-requests') {
    return new AuthError('too-many-requests')
  }

  if (code === 'auth/network-request-failed') {
    return new AuthError('password-update-network-unavailable')
  }

  return new AuthError('password-update-failed')
}

function mapSensitiveActionError(
  error: unknown,
  operation: SensitiveOperation,
): AuthError {
  const code = getFirebaseErrorCode(error)

  if (code === 'auth/wrong-password') {
    return new AuthError('incorrect-current-password')
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/user-mismatch'
  ) {
    return new AuthError('current-credential-invalid')
  }

  if (code === 'auth/requires-recent-login') {
    return new AuthError('recent-login-required')
  }

  if (code === 'auth/user-not-found' && operation === 'delete-account') {
    return new AuthError('account-deletion-user-not-found')
  }

  if (code === 'auth/too-many-requests') {
    return new AuthError('too-many-requests')
  }

  if (code === 'auth/network-request-failed') {
    return new AuthError(
      operation === 'update-password'
        ? 'password-update-network-unavailable'
        : 'account-deletion-network-unavailable',
    )
  }

  return new AuthError(
    operation === 'update-password'
      ? 'password-update-failed'
      : 'account-deletion-failed',
  )
}

export class FirebaseAuthRepository implements AuthRepository {
  private readonly auth: Auth
  private readonly operations: FirebaseAuthOperations

  constructor(
    auth: Auth,
    operations: FirebaseAuthOperations = defaultOperations,
  ) {
    this.auth = auth
    this.operations = operations
  }

  async registerWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    try {
      const credential = await this.operations.createUser(
        this.auth,
        email,
        password,
      )
      return mapFirebaseUser(credential.user)
    } catch (error) {
      throw mapFirebaseAuthError(error)
    }
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    try {
      const credential = await this.operations.signIn(
        this.auth,
        email,
        password,
      )
      return mapFirebaseUser(credential.user)
    } catch (error) {
      throw mapFirebaseAuthError(error)
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.operations.signOut(this.auth)
    } catch {
      throw new AuthError('sign-out-failed')
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await this.operations.sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      const mappedError = mapFirebaseAuthError(error)

      if (mappedError.code === 'invalid-credentials') {
        return
      }

      if (mappedError.code === 'unknown') {
        throw new AuthError('password-reset-failed')
      }

      throw mappedError
    }
  }

  async sendVerificationEmail(): Promise<void> {
    const user = this.auth.currentUser

    if (user === null) {
      throw new AuthError('user-not-authenticated')
    }

    try {
      await this.operations.sendEmailVerification(user)
    } catch (error) {
      const mappedError = mapFirebaseAuthError(error)

      if (
        mappedError.code === 'too-many-requests' ||
        mappedError.code === 'network-unavailable'
      ) {
        throw mappedError
      }

      throw new AuthError('email-verification-failed')
    }
  }

  async reloadAuthenticatedUser(): Promise<AuthenticatedUser> {
    const user = this.auth.currentUser

    if (user === null) {
      throw new AuthError('user-not-authenticated')
    }

    try {
      await this.operations.reload(user)
      return mapFirebaseUser(user)
    } catch (error) {
      const mappedError = mapFirebaseAuthError(error)

      if (mappedError.code === 'network-unavailable') {
        throw mappedError
      }

      throw new AuthError('email-verification-failed')
    }
  }

  async updatePassword(input: {
    readonly currentPassword: string
    readonly newPassword: string
  }): Promise<void> {
    const user = await this.reauthenticateSensitiveAction({
      operation: 'update-password',
      reauthentication: { currentPassword: input.currentPassword },
    })

    try {
      await this.operations.updatePassword(user, input.newPassword)
    } catch (error) {
      throw mapPasswordUpdateError(error)
    }
  }

  async deleteCurrentUser(input: {
    readonly currentPassword: string
  }): Promise<void> {
    const user = await this.reauthenticateSensitiveAction({
      operation: 'delete-account',
      reauthentication: input,
    })

    try {
      await this.operations.deleteUser(user)
    } catch (error) {
      throw mapSensitiveActionError(error, 'delete-account')
    }
  }

  private async reauthenticateSensitiveAction(
    action: SensitiveAction,
  ): Promise<User> {
    const user = this.auth.currentUser

    if (user === null) {
      throw new AuthError(
        action.operation === 'update-password'
          ? 'password-update-user-not-authenticated'
          : 'account-deletion-user-not-authenticated',
      )
    }

    if (user.email === null) {
      throw new AuthError('user-email-unavailable')
    }

    let credential: AuthCredential

    try {
      credential = this.operations.createEmailCredential(
        user.email,
        action.reauthentication.currentPassword,
      )
      await this.operations.reauthenticate(user, credential)
      return user
    } catch (error) {
      throw mapSensitiveActionError(error, action.operation)
    }
  }

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    return this.operations.subscribe(this.auth, (user) => {
      listener(user === null ? null : mapFirebaseUser(user))
    })
  }
}
