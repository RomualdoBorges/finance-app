import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { useAuth } from '../features/auth/hooks/useAuth'
import { GroupError } from '../features/group/domain/GroupError'
import type { GroupService } from '../features/group/services/GroupService'
import {
  personalGroupQueryKey,
  personalGroupQueryRoot,
} from '../features/group/queries/groupQueryKeys'
import { useUserProfile } from '../features/user/hooks/useUserProfile'
import { userProfileQueryKey } from '../features/user/queries/userProfileQueryKeys'
import { GroupContext, type GroupContextValue } from './GroupContext'

type GroupProviderProps = {
  readonly children: ReactNode
  readonly service: GroupService
}

export function GroupProvider({ children, service }: GroupProviderProps) {
  const { status: authStatus, user } = useAuth()
  const { status: profileStatus, profile } = useUserProfile()
  const queryClient = useQueryClient()
  const enabled =
    authStatus === 'authenticated' &&
    user !== null &&
    profileStatus === 'ready' &&
    profile !== null
  const query = useQuery({
    queryKey: personalGroupQueryKey(user?.uid ?? 'idle'),
    queryFn: async () => {
      if (user === null) {
        throw new Error('Group query was enabled without a user')
      }
      const result = await service.bootstrapPersonalGroup({ userId: user.uid })
      queryClient.setQueryData(userProfileQueryKey(user.uid), result.profile)
      return result
    },
    enabled,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      queryClient.removeQueries({ queryKey: personalGroupQueryRoot })
    }
  }, [authStatus, queryClient])

  let value: GroupContextValue
  if (!enabled) {
    value = {
      group: null,
      activeGroup: null,
      membership: null,
      status: 'idle',
      error: null,
      refresh: () => Promise.resolve(),
    }
  } else {
    value = {
      group: query.data?.group ?? null,
      activeGroup: query.data?.activeGroup ?? null,
      membership: query.data?.membership ?? null,
      status: query.isPending ? 'loading' : query.isError ? 'error' : 'ready',
      error: query.isError ? (query.error as GroupError) : null,
      refresh: async () => {
        await query.refetch()
      },
    }
  }

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>
}
