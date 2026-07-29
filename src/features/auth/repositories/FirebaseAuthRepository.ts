import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  type Auth,
  type User,
  type UserCredential,
} from 'firebase/auth'

import { AuthError, type AuthErrorCode } from '../domain/AuthError'
import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
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
  readonly subscribe: (
    auth: Auth,
    listener: (user: User | null) => void,
  ) => () => void
}

const defaultOperations: FirebaseAuthOperations = {
  createUser: createUserWithEmailAndPassword,
  signIn: signInWithEmailAndPassword,
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

  subscribeToAuthState(
    listener: (user: AuthenticatedUser | null) => void,
  ): () => void {
    return this.operations.subscribe(this.auth, (user) => {
      listener(user === null ? null : mapFirebaseUser(user))
    })
  }
}
