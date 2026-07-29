import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  AuthContext,
  type AuthContextValue,
} from '../../../providers/AuthContext'
import { renderWithProviders } from '../../../test/render'
import { AuthError } from '../domain/AuthError'
import { SignOutButton } from './SignOutButton'

const authenticatedUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  emailVerified: false,
}

function renderButton(signOut: AuthContextValue['signOut']) {
  return renderWithProviders(
    <AuthContext.Provider
      value={{
        status: 'authenticated',
        user: authenticatedUser,
        registerWithEmailAndPassword: vi.fn(),
        signInWithEmailAndPassword: vi.fn(),
      signOut,
      sendPasswordResetEmail: vi.fn(),
      }}
    >
      <SignOutButton />
    </AuthContext.Provider>,
  )
}

describe('SignOutButton', () => {
  it('chama o logout uma vez e bloqueia cliques enquanto aguarda', async () => {
    const user = userEvent.setup()
    let resolveSignOut: (() => void) | undefined
    const signOut = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve
        }),
    )
    renderButton(signOut)

    const button = screen.getByRole('button', { name: 'Sair da conta' })
    button.focus()
    await user.keyboard('{Enter}')

    expect(signOut).toHaveBeenCalledOnce()
    expect(
      screen.getByRole('button', { name: 'Saindo da conta' }),
    ).toBeDisabled()
    expect(screen.getByText('Saindo...')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Saindo da conta' }))
    expect(signOut).toHaveBeenCalledOnce()

    resolveSignOut?.()
  })

  it('anuncia erro sanitizado, reabilita e permite tentar novamente sem retry', async () => {
    const user = userEvent.setup()
    const signOut = vi
      .fn<AuthContextValue['signOut']>()
      .mockRejectedValueOnce(new AuthError('sign-out-failed'))
      .mockResolvedValueOnce(undefined)
    renderButton(signOut)

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível sair da conta. Tente novamente.',
    )
    expect(signOut).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Sair da conta' }))
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(2))
  })
})
