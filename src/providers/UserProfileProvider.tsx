import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { useAuth } from '../features/auth/hooks/useAuth'
import type { UserProfileError } from '../features/user/domain/UserProfileError'
import type { UserService } from '../features/user/services/UserService'
import {
  UserProfileContext,
  type UserProfileContextValue,
} from './UserProfileContext'

const userProfileQueryKey = (uid: string) => ['user-profile', uid] as const

type UserProfileProviderProps = {
  readonly children: ReactNode
  readonly service: UserService
}

export function UserProfileProvider({
  children,
  service,
}: UserProfileProviderProps) {
  const { status: authStatus, user } = useAuth()
  const queryClient = useQueryClient()
  const uid = user?.uid
  const query = useQuery({
    queryKey: userProfileQueryKey(uid ?? 'idle'),
    queryFn: () => {
      if (user === null) {
        throw new Error('Profile query was enabled without a user')
      }
      return service.ensureUserProfile(user)
    },
    enabled: authStatus === 'authenticated' && user !== null,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      queryClient.removeQueries({ queryKey: ['user-profile'] })
    }
  }, [authStatus, queryClient])

  let value: UserProfileContextValue
  if (authStatus !== 'authenticated' || user === null) {
    value = {
      profile: null,
      status: 'idle',
      error: null,
      refreshProfile: () => Promise.resolve(),
    }
  } else {
    value = {
      profile: query.data ?? null,
      status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
      error: query.isError ? (query.error as UserProfileError) : null,
      refreshProfile: async () => {
        await query.refetch()
      },
    }
  }

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  )
}
