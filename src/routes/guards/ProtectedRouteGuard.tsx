import { Navigate, Outlet } from 'react-router-dom'

import { useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
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
        state={{ from: location.pathname }}
        to={routePaths.login}
      />
    )
  }

  return <Outlet />
}
