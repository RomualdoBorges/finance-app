import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import { RouteGuardFallback } from './RouteGuardFallback'

export function EmailVerificationRouteGuard() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'authenticated' && user?.emailVerified === true) {
    return <Navigate replace to={routePaths.home} />
  }

  return <Outlet />
}
