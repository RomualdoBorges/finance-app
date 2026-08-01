import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import { resolvePostAuthenticationDestination } from '../authRedirect'
import { RouteGuardFallback } from './RouteGuardFallback'

export function EmailVerificationRouteGuard() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'unauthenticated') {
    return <Navigate replace to={routePaths.login} />
  }

  if (status === 'authenticated' && user?.emailVerified === true) {
    return (
      <Navigate
        replace
        to={resolvePostAuthenticationDestination(location.state)}
      />
    )
  }

  return <Outlet />
}
