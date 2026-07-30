import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { useAuth } from '../features/auth/hooks/useAuth'
import { GroupError } from '../features/group/domain/GroupError'
import type { GroupService } from '../features/group/services/GroupService'
import { useUserProfile } from '../features/user/hooks/useUserProfile'
import { GroupContext, type GroupContextValue } from './GroupContext'

const groupQueryKey = (uid: string) => ['personal-group', uid] as const

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
    queryKey: groupQueryKey(user?.uid ?? 'idle'),
    queryFn: () => {
      if (user === null) {
        throw new Error('Group query was enabled without a user')
      }
      return service.ensurePersonalGroup(user).then(async (personalGroup) => {
        await service.ensureActiveGroup(user.uid, personalGroup.group.id)
        const activeGroup = await service.getActiveGroup(user.uid)
        if (activeGroup === null) {
          throw new GroupError('not-found')
        }
        return { ...personalGroup, activeGroup }
      })
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
      queryClient.removeQueries({ queryKey: ['personal-group'] })
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
