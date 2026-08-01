import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/render'
import type { AccountService } from '../services/AccountService'
import { useAccounts } from './useAccounts'

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ status: 'authenticated', user: { uid: 'u1' } }),
}))
vi.mock('../../group/hooks/useActiveGroup', () => ({
  useActiveGroup: () => ({
    activeGroup: null,
    membership: null,
    loading: false,
    error: null,
  }),
}))
function Probe({ service }: { readonly service: AccountService }) {
  const result = useAccounts(service)
  return <span>{result.loading ? 'carregando' : 'ociosa'}</span>
}
describe('useAccounts', () => {
  it('não consulta sem grupo ativo', () => {
    const listByGroup = vi.fn()
    renderWithProviders(
      <Probe service={{ listByGroup } as unknown as AccountService} />,
    )
    expect(screen.getByText('ociosa')).toBeInTheDocument()
    expect(listByGroup).not.toHaveBeenCalled()
  })
})
