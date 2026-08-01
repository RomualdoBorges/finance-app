import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import { routePaths } from '../paths'
import {
  createInternalDestination,
  readAuthRedirectState,
} from '../authRedirect'
import { RouteGuardFallback } from './RouteGuardFallback'

export function VerifiedEmailGuard() {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <RouteGuardFallback />
  }

  if (status === 'authenticated' && user?.emailVerified === false) {
    const existingState = readAuthRedirectState(location.state)
    const state =
      existingState.from === undefined
        ? { from: createInternalDestination(location) }
        : existingState
    return <Navigate replace state={state} to={routePaths.emailVerification} />
  }

  return <Outlet />
}
