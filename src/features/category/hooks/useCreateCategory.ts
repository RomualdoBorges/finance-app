import { useMutation, useQueryClient } from '@tanstack/react-query'

import { services } from '../../../app/composition/services'
import { useAuth } from '../../auth/hooks/useAuth'
import { useActiveGroup } from '../../group/hooks/useActiveGroup'
import type { Category, CreateCustomCategoryInput } from '../domain/Category'
import { CategoryError } from '../domain/CategoryError'
import { categoriesByGroupQueryKey } from '../queries/categoryQueryKeys'
import type { CategoryService } from '../services/CategoryService'

export function useCreateCategory(
  service: CategoryService = services.category,
) {
  const { user } = useAuth()
  const { activeGroup } = useActiveGroup()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: CreateCustomCategoryInput) => {
      if (user === null || activeGroup === null) {
        throw new CategoryError('unauthenticated')
      }
      return service.createCustomCategory(
        { groupId: activeGroup.id, userId: user.uid },
        input,
      )
    },
    onSuccess: (created) => {
      if (activeGroup === null) return
      queryClient.setQueryData<readonly Category[]>(
        categoriesByGroupQueryKey(activeGroup.id),
        (current = []) => [...current, created],
      )
    },
  })

  return {
    createCategory: mutation.mutateAsync,
    creating: mutation.isPending,
    error: mutation.isError ? mutation.error : null,
    reset: mutation.reset,
  } as const
}
