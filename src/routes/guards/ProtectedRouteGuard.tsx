import { Navigate, Outlet } from 'react-router-dom'

import type { RoutePath } from '../paths'
import { RouteGuardFallback } from './RouteGuardFallback'
import type { SessionStatus } from './session'

type ProtectedRouteGuardProps = {
  readonly sessionStatus: SessionStatus
  readonly publicRoute: RoutePath
}

export function ProtectedRouteGuard({
  sessionStatus,
  publicRoute,
}: ProtectedRouteGuardProps) {
  if (sessionStatus === 'unknown') {
    return <RouteGuardFallback />
  }

  if (sessionStatus === 'unauthenticated') {
    return <Navigate replace to={publicRoute} />
  }

  return <Outlet />
}
