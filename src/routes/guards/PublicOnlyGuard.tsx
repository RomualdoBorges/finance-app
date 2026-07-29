import { Navigate, Outlet } from 'react-router-dom'

import type { RoutePath } from '../paths'
import { RouteGuardFallback } from './RouteGuardFallback'
import type { SessionStatus } from './session'

type PublicOnlyGuardProps = {
  readonly sessionStatus: SessionStatus
  readonly protectedRoute: RoutePath
}

export function PublicOnlyGuard({
  sessionStatus,
  protectedRoute,
}: PublicOnlyGuardProps) {
  if (sessionStatus === 'unknown') {
    return <RouteGuardFallback />
  }

  if (sessionStatus === 'authenticated') {
    return <Navigate replace to={protectedRoute} />
  }

  return <Outlet />
}
