import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/render'
import type { AccountService } from '../services/AccountService'
import { useAccountMutations } from './useAccountMutations'

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}))
vi.mock('../../group/hooks/useActiveGroup', () => ({
  useActiveGroup: () => ({ activeGroup: { id: 'g1' } }),
}))

function Probe({ service }: { readonly service: AccountService }) {
  const mutations = useAccountMutations(service)
  return (
    <>
      <button
        onClick={() => {
          void mutations
            .archiveAccount({ accountId: 'a1' })
            .catch(() => undefined)
        }}
      >
        Arquivar
      </button>
      {mutations.error ? <span>{mutations.error.message}</span> : null}
    </>
  )
}
describe('useAccountMutations', () => {
  it('propaga contexto, sucesso e erro da mutation', async () => {
    const archiveAccount = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('falha'))
    const service = { archiveAccount } as unknown as AccountService
    renderWithProviders(<Probe service={service} />)
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    await waitFor(() =>
      expect(archiveAccount).toHaveBeenCalledWith(
        { groupId: 'g1', userId: 'u1' },
        { accountId: 'a1' },
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }))
    expect(await screen.findByText('falha')).toBeInTheDocument()
  })
})
