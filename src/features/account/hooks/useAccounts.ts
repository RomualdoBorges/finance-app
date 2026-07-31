import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import {
  accountQueryRoot,
  accountsByGroupQueryKey,
} from '../queries/accountQueryKeys'
import type { AccountService } from '../services/AccountService'

export function useAccounts(service: AccountService = services.account) {
  const { status, user } = useAuth()
  const group = useActiveGroup()
  const queryClient = useQueryClient()
  const enabled =
    status === 'authenticated' &&
    user !== null &&
    group.activeGroup !== null &&
    group.membership !== null
  const groupId = group.activeGroup?.id ?? 'idle'
  const query = useQuery({
    queryKey: accountsByGroupQueryKey(groupId),
    queryFn: () => {
      if (group.activeGroup === null)
        throw new Error('Account query enabled without context')
      return service.listByGroup(group.activeGroup.id)
    },
    enabled,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (status === 'unauthenticated')
      queryClient.removeQueries({ queryKey: accountQueryRoot })
  }, [queryClient, status])
  return {
    accounts: query.data ?? [],
    loading: group.loading || (enabled && query.isPending),
    error: group.error ?? (query.isError ? query.error : null),
    refresh: async () => {
      if (enabled) await query.refetch()
    },
  } as const
}
