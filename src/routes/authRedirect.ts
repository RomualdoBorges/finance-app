import type { Location } from 'react-router-dom'

import { routePaths } from './paths'

export type InternalDestination = {
  readonly pathname: string
  readonly search: string
  readonly hash: string
}

export type AuthRedirectState = {
  readonly from?: InternalDestination
}

function isInternalPathname(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
  )
}

function isSearch(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || value.startsWith('?'))
}

function isHash(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || value.startsWith('#'))
}

export function createInternalDestination(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
): InternalDestination {
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  }
}

export function readAuthRedirectState(state: unknown): AuthRedirectState {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return {}
  }

  const from = state.from
  if (
    typeof from !== 'object' ||
    from === null ||
    !('pathname' in from) ||
    !('search' in from) ||
    !('hash' in from) ||
    !isInternalPathname(from.pathname) ||
    !isSearch(from.search) ||
    !isHash(from.hash)
  ) {
    return {}
  }

  return {
    from: {
      pathname: from.pathname,
      search: from.search,
      hash: from.hash,
    },
  }
}

export function resolvePostAuthenticationDestination(state: unknown) {
  return readAuthRedirectState(state).from ?? routePaths.authenticatedHome
}
