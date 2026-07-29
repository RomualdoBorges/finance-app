import { createContext } from 'react'

import type { AuthenticatedUser } from '../features/auth/domain/AuthenticatedUser'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  readonly user: AuthenticatedUser | null
  readonly status: AuthStatus
  readonly registerWithEmailAndPassword: (
    email: string,
    password: string,
  ) => Promise<AuthenticatedUser>
  readonly signInWithEmailAndPassword: (
    email: string,
    password: string,
  ) => Promise<AuthenticatedUser>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
