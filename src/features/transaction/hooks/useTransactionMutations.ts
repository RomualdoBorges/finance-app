import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import type {
  OppositeTransactionInput,
  Transaction,
  UpdateTransactionInput,
} from '../domain/Transaction'
import { TransactionError } from '../domain/TransactionError'
import { transactionsByGroupQueryKey } from '../queries/transactionQueryKeys'

export function useTransactionMutations() {
  const { user } = useAuth()
  const { activeGroup } = useActiveGroup()
  const client = useQueryClient()
  const context = () => {
    if (!user || !activeGroup) throw new TransactionError('unauthenticated')
    return { groupId: activeGroup.id, userId: user.uid }
  }
  const invalidate = async () => {
    if (activeGroup)
      await client.invalidateQueries({
        queryKey: transactionsByGroupQueryKey(activeGroup.id),
      })
  }
  const update = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: UpdateTransactionInput
    }) => services.transaction.updateTransaction(context(), id, input),
    onSuccess: invalidate,
    retry: false,
  })
  const confirm = useMutation({
    mutationFn: (id: string) =>
      services.transaction.confirmTransaction(context(), id),
    onSuccess: invalidate,
    retry: false,
  })
  const cancel = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      services.transaction.cancelTransaction(context(), id, reason),
    onSuccess: invalidate,
    retry: false,
  })
  const reversal = useMutation({
    mutationFn: ({
      transaction,
      input,
    }: {
      transaction: Transaction
      input: OppositeTransactionInput
    }) => services.transaction.createReversal(context(), transaction, input),
    onSuccess: invalidate,
    retry: false,
  })
  const refund = useMutation({
    mutationFn: ({
      transaction,
      input,
    }: {
      transaction: Transaction
      input: OppositeTransactionInput
    }) => services.transaction.createRefund(context(), transaction, input),
    onSuccess: invalidate,
    retry: false,
  })
  return {
    update,
    confirm,
    cancel,
    reversal,
    refund,
    pending:
      update.isPending ||
      confirm.isPending ||
      cancel.isPending ||
      reversal.isPending ||
      refund.isPending,
  } as const
}
