import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { AuthContextValue } from '../../providers/AuthContext'
import { AuthContext } from '../../providers/AuthContext'
import { ProtectedRouteGuard } from './ProtectedRouteGuard'
import { PublicOnlyGuard } from './PublicOnlyGuard'

function contextValue(status: AuthContextValue['status']): AuthContextValue {
  return {
    status,
    user:
      status === 'authenticated'
        ? {
            uid: 'user-1',
            email: null,
            displayName: null,
            photoURL: null,
            emailVerified: false,
          }
        : null,
    registerWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
  }
}

function renderGuards(status: AuthContextValue['status'], entry: string) {
  return render(
    <AuthContext.Provider value={contextValue(status)}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route element={<PublicOnlyGuard />}>
            <Route path="/login" element={<h1>Login</h1>} />
          </Route>
          <Route element={<ProtectedRouteGuard />}>
            <Route path="/" element={<h1>Protegida</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('guards de autenticação', () => {
  it('PublicOnlyGuard bloqueia usuário autenticado', () => {
    renderGuards('authenticated', '/login')
    expect(
      screen.getByRole('heading', { name: 'Protegida' }),
    ).toBeInTheDocument()
  })

  it('ProtectedRouteGuard bloqueia usuário não autenticado', () => {
    renderGuards('unauthenticated', '/')
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })

  it.each(['/login', '/'])('aguarda o fim do loading em %s', (entry) => {
    renderGuards('loading', entry)
    expect(screen.getByText('Verificando acesso…')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
