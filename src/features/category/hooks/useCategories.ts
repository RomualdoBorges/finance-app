import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import {
  categoriesByGroupQueryKey,
  categoryQueryRoot,
} from '../queries/categoryQueryKeys'
import type { CategoryService } from '../services/CategoryService'

export function useCategories(service: CategoryService = services.category) {
  const { status: authStatus, user } = useAuth()
  const group = useActiveGroup()
  const queryClient = useQueryClient()
  const enabled =
    authStatus === 'authenticated' &&
    user !== null &&
    group.activeGroup !== null &&
    group.membership !== null
  const groupId = group.activeGroup?.id ?? 'idle'
  const query = useQuery({
    queryKey: categoriesByGroupQueryKey(groupId),
    queryFn: () => {
      if (user === null || group.activeGroup === null) {
        throw new Error('Category query was enabled without its context')
      }
      return service.ensureDefaultCategories({
        groupId: group.activeGroup.id,
        userId: user.uid,
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
      queryClient.removeQueries({ queryKey: categoryQueryRoot })
    }
  }, [authStatus, queryClient])

  return {
    categories: query.data ?? [],
    loading: group.loading || (enabled && query.isPending),
    error: group.error ?? (query.isError ? query.error : null),
    refresh: async () => {
      if (enabled) await query.refetch()
    },
  } as const
}
