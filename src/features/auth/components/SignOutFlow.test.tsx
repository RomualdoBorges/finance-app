import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import { AuthError } from '../domain/AuthError'
import { AuthService } from '../services/AuthService'
import { AuthProvider } from '../../../providers/AuthProvider'
import { QueryProvider } from '../../../providers/QueryProvider'
import { ProtectedRouteGuard } from '../../../routes/guards/ProtectedRouteGuard'
import { createAuthRepositoryMock } from '../../../test/mocks/repositories/authRepositoryMock'
import { SignOutButton } from './SignOutButton'

const user: AuthenticatedUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  emailVerified: false,
}

function renderFlow(fail = false) {
  const repository = createAuthRepositoryMock()
  let listener: ((value: AuthenticatedUser | null) => void) | undefined
  repository.subscribeToAuthState.mockImplementation((nextListener) => {
    listener = nextListener
    return () => undefined
  })
  repository.signOut.mockImplementation(() => {
    if (fail) return Promise.reject(new AuthError('sign-out-failed'))
    listener?.(null)
    return Promise.resolve()
  })

  const view = (
    <QueryProvider>
      <AuthProvider service={new AuthService(repository)}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/entrar" element={<h1>Login</h1>} />
            <Route element={<ProtectedRouteGuard />}>
              <Route
                path="/"
                element={
                  <>
                    <h1>Conteúdo protegido</h1>
                    <SignOutButton />
                  </>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryProvider>
  )

  return {
    repository,
    view,
    authenticate() {
      act(() => listener?.(user))
    },
  }
}

describe('fluxo de logout', () => {
  it('aguarda a sessão nula e deixa o guard redirecionar', async () => {
    const flow = renderFlow()
    const { render } = await import('@testing-library/react')
    render(flow.view)
    flow.authenticate()

    await userEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

    expect(
      await screen.findByRole('heading', { name: 'Login' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Conteúdo protegido' }),
    ).not.toBeInTheDocument()
  })

  it('mantém a rota e permite nova tentativa quando o logout falha', async () => {
    const flow = renderFlow(true)
    const { render } = await import('@testing-library/react')
    render(flow.view)
    flow.authenticate()

    await userEvent.click(screen.getByRole('button', { name: 'Sair da conta' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Conteúdo protegido' }),
    ).toBeInTheDocument()
    expect(flow.repository.signOut.mock.calls).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Sair da conta' })).toBeEnabled()
  })
})
