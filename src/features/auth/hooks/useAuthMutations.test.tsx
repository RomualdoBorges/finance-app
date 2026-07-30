import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AuthContext } from '../../../providers/AuthContext'
import { renderWithProviders } from '../../../test/render'
import { useUpdatePassword } from './useAuthMutations'

function UpdatePasswordMutationProbe() {
  const mutation = useUpdatePassword()

  return (
    <button
      onClick={() =>
        mutation.mutate({
          currentPassword: 'senha-atual',
          newPassword: 'senha-nova',
        })
      }
      type="button"
    >
      Executar
    </button>
  )
}

describe('useUpdatePassword', () => {
  it('chama a operação uma vez e não repete após falha', async () => {
    const user = userEvent.setup()
    const updatePassword = vi.fn().mockRejectedValue(new Error('falha'))

    renderWithProviders(
      <AuthContext.Provider
        value={{
          status: 'authenticated',
          user: {
            uid: 'user-1',
            email: 'pessoa@example.com',
            displayName: null,
            photoURL: null,
            emailVerified: true,
          },
          registerWithEmailAndPassword: vi.fn(),
          signInWithEmailAndPassword: vi.fn(),
          signOut: vi.fn(),
          sendPasswordResetEmail: vi.fn(),
          sendVerificationEmail: vi.fn(),
          reloadAuthenticatedUser: vi.fn(),
          updatePassword,
        }}
      >
        <UpdatePasswordMutationProbe />
      </AuthContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Executar' }))
    await waitFor(() => expect(updatePassword).toHaveBeenCalledOnce())
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(updatePassword).toHaveBeenCalledOnce()
  })
})
