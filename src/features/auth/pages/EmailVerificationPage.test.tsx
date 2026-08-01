import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'

import { AuthProvider } from '../../../providers/AuthProvider'
import { createAuthRepositoryMock } from '../../../test/mocks/repositories/authRepositoryMock'
import { renderWithProviders } from '../../../test/render'
import { AuthError } from '../domain/AuthError'
import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import { AuthService } from '../services/AuthService'
import { EmailVerificationPage } from './EmailVerificationPage'
import { ProtectedRouteGuard } from '../../../routes/guards/ProtectedRouteGuard'
import { EmailVerificationRouteGuard } from '../../../routes/guards/EmailVerificationRouteGuard'
import { VerifiedEmailGuard } from '../../../routes/guards/VerifiedEmailGuard'

const unverifiedUser: AuthenticatedUser = {
  uid: 'user-1',
  email: 'pessoa@example.com',
  displayName: null,
  photoURL: null,
  emailVerified: false,
}

function renderPage(
  configure?: (repository: ReturnType<typeof createAuthRepositoryMock>) => void,
) {
  const repository = createAuthRepositoryMock()
  repository.subscribeToAuthState.mockImplementation((listener) => {
    listener(unverifiedUser)
    return vi.fn()
  })
  repository.sendVerificationEmail.mockResolvedValue(undefined)
  repository.reloadAuthenticatedUser.mockResolvedValue(unverifiedUser)
  configure?.(repository)

  renderWithProviders(
    <AuthProvider service={new AuthService(repository)}>
      <EmailVerificationPage />
    </AuthProvider>,
  )

  return repository
}

describe('EmailVerificationPage', () => {
  it('envia explicitamente somente uma vez durante o intervalo', async () => {
    const user = userEvent.setup()
    const repository = renderPage()

    expect(
      screen.getByRole('heading', { name: 'Verifique seu e-mail' }),
    ).toBeInTheDocument()
    expect(screen.getByText('pessoa@example.com')).toBeInTheDocument()
    expect(repository.sendVerificationEmail.mock.calls).toHaveLength(0)

    await user.click(
      screen.getByRole('button', { name: 'Enviar e-mail de verificação' }),
    )

    expect(repository.sendVerificationEmail.mock.calls).toHaveLength(1)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'E-mail de verificação enviado.',
    )
    expect(
      screen.getByRole('button', { name: 'Reenviar em 60s' }),
    ).toBeDisabled()
  })

  it('informa quando a atualização ainda encontra o e-mail pendente', async () => {
    const user = userEvent.setup()
    const repository = renderPage()

    await user.click(
      screen.getByRole('button', { name: 'Já verifiquei meu e-mail' }),
    )

    expect(repository.reloadAuthenticatedUser.mock.calls).toHaveLength(1)
    expect(await screen.findByRole('status')).toHaveTextContent(
      'ainda não aparece como verificado',
    )
  })

  it('atualiza a experiência quando o Firebase confirma a verificação', async () => {
    const user = userEvent.setup()
    const repository = createAuthRepositoryMock()
    repository.subscribeToAuthState.mockImplementation((listener) => {
      listener(unverifiedUser)
      return vi.fn()
    })
    repository.reloadAuthenticatedUser.mockResolvedValue({
      ...unverifiedUser,
      emailVerified: true,
    })

    renderWithProviders(
      <AuthProvider service={new AuthService(repository)}>
        <Routes>
          <Route element={<ProtectedRouteGuard />}>
            <Route element={<EmailVerificationRouteGuard />}>
              <Route
                path="/verificar-email"
                element={<EmailVerificationPage />}
              />
            </Route>
            <Route element={<VerifiedEmailGuard />}>
              <Route path="/" element={<h1>Início autenticado</h1>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>,
      { initialEntries: ['/verificar-email'] },
    )

    await user.click(
      screen.getByRole('button', { name: 'Já verifiquei meu e-mail' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Início autenticado' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Verifique seu e-mail' }),
    ).not.toBeInTheDocument()
  })

  it('mostra uma falha sanitizada e permite novo reenvio', async () => {
    const user = userEvent.setup()
    renderPage((repository) => {
      repository.sendVerificationEmail.mockRejectedValue(
        new AuthError('network-unavailable'),
      )
    })

    await user.click(
      screen.getByRole('button', { name: 'Enviar e-mail de verificação' }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Verifique sua conexão',
    )
    expect(
      screen.getByRole('button', { name: 'Enviar e-mail de verificação' }),
    ).toBeEnabled()
  })
})
