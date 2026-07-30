import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import {
  AuthContext,
  type AuthContextValue,
} from '../../../providers/AuthContext'
import { renderWithProviders } from '../../../test/render'
import { AuthError } from '../domain/AuthError'
import { DeleteCurrentUserPage } from './DeleteCurrentUserPage'

function LocationView() {
  return <span data-testid="location">{useLocation().pathname}</span>
}

function renderPage(
  deleteCurrentUser: AuthContextValue['deleteCurrentUser'],
  signOut: AuthContextValue['signOut'] = vi.fn(),
) {
  return renderWithProviders(
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
      <LocationView />
      <Routes>
        <Route path="/conta/excluir" element={<DeleteCurrentUserPage />} />
        <Route path="/" element={<h1>Início</h1>} />
      </Routes>
    </AuthContext.Provider>,
    { initialEntries: ['/conta/excluir'] },
  )
}

describe('DeleteCurrentUserPage', () => {
  it('renderiza a página dedicada e seus controles acessíveis', () => {
    renderPage(vi.fn())

    expect(
      screen.getByRole('heading', { level: 1, name: 'Excluir conta' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'A exclusão removerá permanentemente sua conta de autenticação.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
    expect(
      screen.getByLabelText('Entendo que esta ação é permanente.'),
    ).not.toBeChecked()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('exige senha e confirmação explícita', async () => {
    const user = userEvent.setup()
    const deleteCurrentUser = vi.fn()
    renderPage(deleteCurrentUser)

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    expect(screen.getByText('Informe sua senha atual.')).toBeInTheDocument()
    expect(
      screen.getByText('Confirme que você entende que esta ação é permanente.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveFocus()
    expect(deleteCurrentUser).not.toHaveBeenCalled()
  })

  it('faz uma submissão, mostra loading e encerra a sessão após sucesso', async () => {
    const user = userEvent.setup()
    let resolveDelete: (() => void) | undefined
    const deleteCurrentUser = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve
        }),
    )
    const signOut = vi.fn().mockResolvedValue(undefined)
    renderPage(deleteCurrentUser, signOut)

    await user.type(screen.getByLabelText('Senha atual'), 'senha-atual')
    await user.click(
      screen.getByLabelText('Entendo que esta ação é permanente.'),
    )
    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    expect(deleteCurrentUser).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Excluindo...' })).toBeDisabled()
    expect(signOut).not.toHaveBeenCalled()

    resolveDelete?.()
    await waitFor(() => expect(signOut).toHaveBeenCalledOnce())
  })

  it('mantém senha, confirmação e rota após falha sanitizada', async () => {
    const user = userEvent.setup()
    const deleteCurrentUser = vi
      .fn()
      .mockRejectedValue(new AuthError('incorrect-current-password'))
    const signOut = vi.fn()
    renderPage(deleteCurrentUser, signOut)

    await user.type(screen.getByLabelText('Senha atual'), 'incorreta')
    await user.click(
      screen.getByLabelText('Entendo que esta ação é permanente.'),
    )
    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha atual está incorreta.',
    )
    expect(screen.getByLabelText('Senha atual')).toHaveValue('incorreta')
    expect(
      screen.getByLabelText('Entendo que esta ação é permanente.'),
    ).toBeChecked()
    expect(screen.getByTestId('location')).toHaveTextContent('/conta/excluir')
    expect(signOut).not.toHaveBeenCalled()
  })
})
