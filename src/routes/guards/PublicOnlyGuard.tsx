import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import {
  readAuthRedirectState,
  resolvePostAuthenticationDestination,
} from '../authRedirect'
import { RouteGuardFallback } from './RouteGuardFallback'

export function PublicOnlyGuard() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'authenticated') {
    const state = readAuthRedirectState(location.state)
    return user?.emailVerified ? (
      <Navigate
        replace
        to={resolvePostAuthenticationDestination(location.state)}
      />
    ) : (
      <Navigate replace state={state} to={routePaths.emailVerification} />
    )
  }

  return <Outlet />
}
