import { act, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../features/auth/domain/AuthenticatedUser'
import { useAuth } from '../features/auth/hooks/useAuth'
import { AuthService } from '../features/auth/services/AuthService'
import { createAuthRepositoryMock } from '../test/mocks/repositories/authRepositoryMock'
import { AuthProvider } from './AuthProvider'

function SessionView() {
  const { reloadAuthenticatedUser, status, user } = useAuth()
  return (
    <>
      <p>{`${status}:${user?.uid ?? 'sem-usuario'}:${String(user?.emailVerified ?? false)}`}</p>
      <button onClick={() => void reloadAuthenticatedUser()} type="button">
        Atualizar
      </button>
    </>
  )
}

function renderProvider() {
  const repository = createAuthRepositoryMock()
  let listener: ((user: AuthenticatedUser | null) => void) | undefined
  const unsubscribe = vi.fn()
  repository.subscribeToAuthState.mockImplementation((nextListener) => {
    listener = nextListener
    return unsubscribe
  })
  const result = render(
    <AuthProvider service={new AuthService(repository)}>
      <SessionView />
    </AuthProvider>,
  )

  return {
    ...result,
    emit(user: AuthenticatedUser | null) {
      act(() => listener?.(user))
    },
    repository,
    unsubscribe,
  }
}

describe('AuthProvider', () => {
  it('inicia em loading', () => {
    renderProvider()
    expect(screen.getByText('loading:sem-usuario:false')).toBeInTheDocument()
  })

  it('representa usuário autenticado', () => {
    const provider = renderProvider()
    provider.emit({
      uid: 'user-1',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
    })
    expect(screen.getByText('authenticated:user-1:false')).toBeInTheDocument()
  })

  it('representa usuário não autenticado', () => {
    const provider = renderProvider()
    provider.emit(null)
    expect(
      screen.getByText('unauthenticated:sem-usuario:false'),
    ).toBeInTheDocument()
  })

  it('assina uma vez e remove a assinatura ao desmontar', () => {
    const provider = renderProvider()
    expect(provider.repository.subscribeToAuthState.mock.calls).toHaveLength(1)
    provider.unmount()
    expect(provider.unsubscribe).toHaveBeenCalledOnce()
  })

  it('publica o usuário recarregado manualmente', async () => {
    const provider = renderProvider()
    provider.emit({
      uid: 'user-1',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: false,
    })
    provider.repository.reloadAuthenticatedUser.mockResolvedValue({
      uid: 'user-1',
      email: null,
      displayName: null,
      photoURL: null,
      emailVerified: true,
    })

    screen.getByRole('button', { name: 'Atualizar' }).click()

    expect(
      await screen.findByText('authenticated:user-1:true'),
    ).toBeInTheDocument()
  })
})
