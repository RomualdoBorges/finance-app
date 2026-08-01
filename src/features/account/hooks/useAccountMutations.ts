import { useMutation, useQueryClient } from '@tanstack/react-query'
import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import type { CreateAccountInput, UpdateAccountInput } from '../domain/Account'
import { AccountError } from '../domain/AccountError'
import { accountsByGroupQueryKey } from '../queries/accountQueryKeys'
import type { AccountService } from '../services/AccountService'

type Action = { readonly accountId: string }
export function useAccountMutations(
  service: AccountService = services.account,
) {
  const { user } = useAuth()
  const { activeGroup } = useActiveGroup()
  const queryClient = useQueryClient()
  const context = () => {
    if (user === null || activeGroup === null)
      throw new AccountError('unauthenticated')
    return { groupId: activeGroup.id, userId: user.uid }
  }
  const refresh = async () => {
    if (activeGroup !== null)
      await queryClient.invalidateQueries({
        queryKey: accountsByGroupQueryKey(activeGroup.id),
      })
  }
  const create = useMutation({
    mutationFn: (input: CreateAccountInput) =>
      service.createAccount(context(), input),
    onSuccess: refresh,
  })
  const update = useMutation({
    mutationFn: (input: UpdateAccountInput) =>
      service.updateAccount(context(), input),
    onSuccess: refresh,
  })
  const archive = useMutation({
    mutationFn: (input: Action) => service.archiveAccount(context(), input),
    onSuccess: refresh,
  })
  const restore = useMutation({
    mutationFn: (input: Action) => service.restoreAccount(context(), input),
    onSuccess: refresh,
  })
  return {
    createAccount: create.mutateAsync,
    updateAccount: update.mutateAsync,
    archiveAccount: archive.mutateAsync,
    restoreAccount: restore.mutateAsync,
    pending:
      create.isPending ||
      update.isPending ||
      archive.isPending ||
      restore.isPending,
    error:
      create.error ?? update.error ?? archive.error ?? restore.error ?? null,
    reset: () => {
      create.reset()
      update.reset()
      archive.reset()
      restore.reset()
    },
  } as const
}
