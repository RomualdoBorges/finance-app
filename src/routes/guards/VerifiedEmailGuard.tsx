import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import { RouteGuardFallback } from './RouteGuardFallback'

export function VerifiedEmailGuard() {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'authenticated' && user?.emailVerified === false) {
    return <Navigate replace to={routePaths.emailVerification} />
  }

  return <Outlet />
}
