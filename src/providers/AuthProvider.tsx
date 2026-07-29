import { useEffect, useMemo, useState, type ReactNode } from 'react'

import type { AuthenticatedUser } from '../features/auth/domain/AuthenticatedUser'
import type { AuthService } from '../features/auth/services/AuthService'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from './AuthContext'

type AuthProviderProps = {
  readonly children: ReactNode
  readonly service: AuthService
}

export function AuthProvider({ children, service }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(
    () =>
      service.subscribeToAuthState((authenticatedUser) => {
        setUser(authenticatedUser)
        setStatus(
          authenticatedUser === null ? 'unauthenticated' : 'authenticated',
        )
      }),
    [service],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      registerWithEmailAndPassword: (email, password) =>
        service.registerWithEmailAndPassword(email, password),
      signInWithEmailAndPassword: (email, password) =>
        service.signInWithEmailAndPassword(email, password),
    }),
    [service, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
