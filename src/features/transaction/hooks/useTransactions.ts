import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import {
  transactionQueryRoot,
  transactionsByGroupQueryKey,
} from '../queries/transactionQueryKeys'
import type { TransactionService } from '../services/TransactionService'

export function useTransactions(
  service: TransactionService = services.transaction,
) {
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
    queryKey: transactionsByGroupQueryKey(groupId),
    queryFn: () => service.listRecentByGroup(groupId),
    enabled,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (status === 'unauthenticated')
      queryClient.removeQueries({ queryKey: transactionQueryRoot })
  }, [queryClient, status])
  return {
    transactions: query.data ?? [],
    loading: group.loading || (enabled && query.isPending),
    error: group.error ?? (query.isError ? query.error : null),
    refresh: async () => {
      if (enabled) await query.refetch()
    },
  } as const
}
