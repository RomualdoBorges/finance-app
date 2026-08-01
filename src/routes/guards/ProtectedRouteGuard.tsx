import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import { createInternalDestination } from '../authRedirect'
import { RouteGuardFallback } from './RouteGuardFallback'

export function ProtectedRouteGuard() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        replace
        state={{ from: createInternalDestination(location) }}
        to={routePaths.login}
      />
    )
  }

  return <Outlet />
}
