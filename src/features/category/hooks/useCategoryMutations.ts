import { useMutation, useQueryClient } from '@tanstack/react-query'

import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import type { UpdateCategoryInput } from '../domain/Category'
import { CategoryError } from '../domain/CategoryError'
import { categoriesByGroupQueryKey } from '../queries/categoryQueryKeys'
import type { CategoryService } from '../services/CategoryService'

type CategoryAction = { readonly categoryId: string }

export function useCategoryMutations(
  service: CategoryService = services.category,
) {
  const { user } = useAuth()
  const { activeGroup } = useActiveGroup()
  const queryClient = useQueryClient()

  const context = () => {
    if (user === null || activeGroup === null) {
      throw new CategoryError('unauthenticated')
    }
    return { groupId: activeGroup.id, userId: user.uid }
  }
  const refresh = async () => {
    if (activeGroup !== null) {
      await queryClient.invalidateQueries({
        queryKey: categoriesByGroupQueryKey(activeGroup.id),
      })
    }
  }

  const update = useMutation({
    mutationFn: (input: UpdateCategoryInput) =>
      service.updateCategory(context(), input),
    onSuccess: refresh,
  })
  const archive = useMutation({
    mutationFn: (input: CategoryAction) =>
      service.archiveCategory(context(), input),
    onSuccess: refresh,
  })
  const restore = useMutation({
    mutationFn: (input: CategoryAction) =>
      service.restoreCategory(context(), input),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (input: CategoryAction) =>
      service.deleteCategory(context(), input),
    onSuccess: refresh,
  })

  return {
    updateCategory: update.mutateAsync,
    archiveCategory: archive.mutateAsync,
    restoreCategory: restore.mutateAsync,
    deleteCategory: remove.mutateAsync,
    pending:
      update.isPending ||
      archive.isPending ||
      restore.isPending ||
      remove.isPending,
    error:
      update.error ?? archive.error ?? restore.error ?? remove.error ?? null,
    reset: () => {
      update.reset()
      archive.reset()
      restore.reset()
      remove.reset()
    },
  } as const
}
