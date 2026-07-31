import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import type { CreateTransactionInput } from '../domain/Transaction'
import { TransactionError } from '../domain/TransactionError'
import { transactionsByGroupQueryKey } from '../queries/transactionQueryKeys'
import type { TransactionService } from '../services/TransactionService'

export function useCreateTransaction(
  service: TransactionService = services.transaction,
) {
  const { user } = useAuth()
  const { activeGroup } = useActiveGroup()
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateTransactionInput) => {
      if (user === null || activeGroup === null)
        throw new TransactionError('unauthenticated')
      return service.createTransaction(
        { groupId: activeGroup.id, userId: user.uid },
        input,
      )
    },
    onSuccess: async () => {
      if (activeGroup !== null)
        await client.invalidateQueries({
          queryKey: transactionsByGroupQueryKey(activeGroup.id),
        })
    },
  })
  return {
    createTransaction: mutation.mutateAsync,
    pending: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  } as const
}
