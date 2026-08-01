import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AuthContext } from '../../../providers/AuthContext'
import { renderWithProviders } from '../../../test/render'
import { useDeleteCurrentUser, useUpdatePassword } from './useAuthMutations'

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
          deleteCurrentUser: vi.fn(),
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

function DeleteCurrentUserMutationProbe() {
  const mutation = useDeleteCurrentUser()

  return (
    <>
      <button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ currentPassword: 'senha-atual' })}
        type="button"
      >
        Excluir
      </button>
      {mutation.isError ? <span>Falhou</span> : null}
    </>
  )
}

describe('useDeleteCurrentUser', () => {
  it('não repete, encerra a sessão somente após excluir e expõe a falha', async () => {
    const user = userEvent.setup()
    const order: string[] = []
    const deleteCurrentUser = vi.fn().mockImplementation(() => {
      order.push('delete')
      return Promise.resolve()
    })
    const signOut = vi.fn().mockImplementation(() => {
      order.push('signOut')
      return Promise.resolve()
    })

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
          signOut,
          sendPasswordResetEmail: vi.fn(),
          sendVerificationEmail: vi.fn(),
          reloadAuthenticatedUser: vi.fn(),
          updatePassword: vi.fn(),
          deleteCurrentUser,
        }}
      >
        <DeleteCurrentUserMutationProbe />
      </AuthContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Excluir' }))
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
    expect(deleteCurrentUser).toHaveBeenCalledOnce()
    expect(order).toEqual(['delete', 'signOut'])
  })
})
