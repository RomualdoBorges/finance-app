import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import { RouteGuardFallback } from './RouteGuardFallback'

export function PublicOnlyGuard() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'authenticated') {
    return <Navigate replace to={routePaths.home} />
  }

  return <Outlet />
}
