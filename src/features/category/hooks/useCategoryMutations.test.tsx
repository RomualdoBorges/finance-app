import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/render'
import type { CategoryService } from '../services/CategoryService'
import { useCategoryMutations } from './useCategoryMutations'

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { uid: 'user-1' },
  }),
}))

vi.mock('../../group/hooks/useActiveGroup', () => ({
  useActiveGroup: () => ({
    activeGroup: { id: 'group-1' },
  }),
}))

function Probe({ service }: { readonly service: CategoryService }) {
  const mutation = useCategoryMutations(service)
  return (
    <>
      <button
        onClick={() =>
          void mutation.archiveCategory({ categoryId: 'category-1' })
        }
      >
        Arquivar
      </button>
      {mutation.pending ? <span>Processando</span> : null}
    </>
  )
}

describe('useCategoryMutations', () => {
  it('encaminha contexto e invalida a lista após sucesso', async () => {
    const archiveCategory = vi.fn().mockResolvedValue(undefined)
    const service = {
      archiveCategory,
    } as unknown as CategoryService
    renderWithProviders(<Probe service={service} />)
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    await waitFor(() =>
      expect(archiveCategory).toHaveBeenCalledWith(
        { groupId: 'group-1', userId: 'user-1' },
        { categoryId: 'category-1' },
      ),
    )
  })
})
