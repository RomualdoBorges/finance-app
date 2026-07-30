import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { AuthContextValue } from '../../providers/AuthContext'
import { AuthContext } from '../../providers/AuthContext'
import { ProtectedRouteGuard } from './ProtectedRouteGuard'
import { PublicOnlyGuard } from './PublicOnlyGuard'
import { EmailVerificationRouteGuard } from './EmailVerificationRouteGuard'
import { VerifiedEmailGuard } from './VerifiedEmailGuard'

function contextValue(
  status: AuthContextValue['status'],
  emailVerified = false,
): AuthContextValue {
  return {
    status,
    user:
      status === 'authenticated'
        ? {
            uid: 'user-1',
            email: null,
            displayName: null,
            photoURL: null,
            emailVerified,
          }
        : null,
    registerWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    sendVerificationEmail: vi.fn(),
    reloadAuthenticatedUser: vi.fn(),
    updatePassword: vi.fn(),
    deleteCurrentUser: vi.fn(),
  }
}

function renderGuards(
  status: AuthContextValue['status'],
  entry: string,
  emailVerified = false,
) {
  return render(
    <AuthContext.Provider value={contextValue(status, emailVerified)}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route element={<PublicOnlyGuard />}>
            <Route path="/login" element={<h1>Login</h1>} />
          </Route>
          <Route element={<ProtectedRouteGuard />}>
            <Route element={<EmailVerificationRouteGuard />}>
              <Route
                path="/verificar-email"
                element={<h1>Verificar e-mail</h1>}
              />
            </Route>
            <Route element={<VerifiedEmailGuard />}>
              <Route path="/" element={<h1>Protegida</h1>} />
              <Route
                path="/conta/alterar-senha"
                element={<h1>Alterar senha</h1>}
              />
              <Route path="/conta/excluir" element={<h1>Excluir conta</h1>} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('guards de autenticação', () => {
  it('PublicOnlyGuard bloqueia usuário autenticado', () => {
    renderGuards('authenticated', '/login', true)
    expect(
      screen.getByRole('heading', { name: 'Protegida' }),
    ).toBeInTheDocument()
  })

  it('ProtectedRouteGuard bloqueia usuário não autenticado', () => {
    renderGuards('unauthenticated', '/')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('redireciona usuário não verificado para a etapa de verificação', () => {
    renderGuards('authenticated', '/')
    expect(
      screen.getByRole('heading', { name: 'Verificar e-mail' }),
    ).toBeInTheDocument()
  })

  it('mantém usuário não verificado na etapa de verificação sem loop', () => {
    renderGuards('authenticated', '/verificar-email')
    expect(
      screen.getByRole('heading', { name: 'Verificar e-mail' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Protegida' }),
    ).not.toBeInTheDocument()
  })

  it('permite que usuário verificado acesse rota autenticada', () => {
    renderGuards('authenticated', '/', true)
    expect(
      screen.getByRole('heading', { name: 'Protegida' }),
    ).toBeInTheDocument()
  })

  it('redireciona usuário verificado da etapa de verificação para home', () => {
    renderGuards('authenticated', '/verificar-email', true)
    expect(
      screen.getByRole('heading', { name: 'Protegida' }),
    ).toBeInTheDocument()
  })

  it('redireciona usuário não autenticado da atualização de senha', () => {
    renderGuards('unauthenticated', '/conta/alterar-senha')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('redireciona usuário não verificado da atualização de senha', () => {
    renderGuards('authenticated', '/conta/alterar-senha')
    expect(
      screen.getByRole('heading', { name: 'Verificar e-mail' }),
    ).toBeInTheDocument()
  })

  it('permite atualização de senha para usuário verificado', () => {
    renderGuards('authenticated', '/conta/alterar-senha', true)
    expect(
      screen.getByRole('heading', { name: 'Alterar senha' }),
    ).toBeInTheDocument()
  })

  it('protege a exclusão por sessão e verificação de e-mail', () => {
    renderGuards('unauthenticated', '/conta/excluir')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it('redireciona usuário não verificado da exclusão', () => {
    renderGuards('authenticated', '/conta/excluir')
    expect(
      screen.getByRole('heading', { name: 'Verificar e-mail' }),
    ).toBeInTheDocument()
  })

  it('permite exclusão para usuário verificado', () => {
    renderGuards('authenticated', '/conta/excluir', true)
    expect(
      screen.getByRole('heading', { name: 'Excluir conta' }),
    ).toBeInTheDocument()
  })

  it.each([
    '/login',
    '/',
    '/verificar-email',
    '/conta/alterar-senha',
    '/conta/excluir',
  ])('aguarda o fim do loading em %s', (entry) => {
    renderGuards('loading', entry)
    expect(screen.getByText('Verificando acesso…')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
