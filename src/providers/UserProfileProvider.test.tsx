import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../features/auth/domain/AuthenticatedUser'
import type { UserProfile } from '../features/user/domain/UserProfile'
import { UserProfileError } from '../features/user/domain/UserProfileError'
import { useUserProfile } from '../features/user/hooks/useUserProfile'
import type { UserRepository } from '../features/user/repositories/UserRepository'
import { UserService } from '../features/user/services/UserService'
import { renderWithProviders } from '../test/render'
import { AuthContext, type AuthStatus } from './AuthContext'
import { UserProfileProvider } from './UserProfileProvider'

const profile = (id: string): UserProfile => ({
  id,
  email: `${id}@example.com`,
  displayName: null,
  photoURL: null,
  activeGroupId: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
})

function ProfileProbe() {
  const {
    status,
    profile: currentProfile,
    error,
    refreshProfile,
  } = useUserProfile()
  return (
    <>
      <span>
        {status}:{currentProfile?.id ?? 'none'}:{error?.code ?? 'none'}
      </span>
      <button onClick={() => void refreshProfile()} type="button">
        Retry
      </button>
    </>
  )
}

function AuthHarness({ children }: { readonly children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthenticatedUser | null>(null)

  const authenticate = (uid: string) => {
    setUser({
      uid,
      email: `${uid}@example.com`,
      displayName: null,
      photoURL: null,
      emailVerified: true,
    })
    setStatus('authenticated')
  }

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        registerWithEmailAndPassword: vi.fn(),
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
        sendVerificationEmail: vi.fn(),
        reloadAuthenticatedUser: vi.fn(),
        updatePassword: vi.fn(),
        deleteCurrentUser: vi.fn(),
      }}
    >
      <button onClick={() => authenticate('user-1')} type="button">
        User 1
      </button>
      <button onClick={() => authenticate('user-2')} type="button">
        User 2
      </button>
      <button
        onClick={() => {
          setUser(null)
          setStatus('unauthenticated')
        }}
        type="button"
      >
        Logout
      </button>
      {children}
    </AuthContext.Provider>
  )
}

function renderProvider(repository: UserRepository) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <AuthHarness>
        <UserProfileProvider service={new UserService(repository)}>
          <ProfileProbe />
        </UserProfileProvider>
      </AuthHarness>
    </QueryClientProvider>,
  )
}

describe('UserProfileProvider', () => {
  it('fica idle durante auth loading e sem usuário', async () => {
    const ensureUserProfile = vi.fn()
    const repository: UserRepository = {
      ensureUserProfile,
      getUserProfile: vi.fn(),
      ensureActiveGroupId: vi.fn(),
      getActiveGroupId: vi.fn(),
    }
    const user = userEvent.setup()
    renderProvider(repository)

    expect(screen.getByText('idle:none:none')).toBeInTheDocument()
    expect(ensureUserProfile).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(screen.getByText('idle:none:none')).toBeInTheDocument()
    expect(ensureUserProfile).not.toHaveBeenCalled()
  })

  it('garante uma vez, publica ready, troca usuário e limpa no logout', async () => {
    const user = userEvent.setup()
    const ensureUserProfile = vi.fn((authenticatedUser: AuthenticatedUser) =>
      Promise.resolve(profile(authenticatedUser.uid)),
    )
    const repository: UserRepository = {
      ensureUserProfile,
      getUserProfile: vi.fn(),
      ensureActiveGroupId: vi.fn(),
      getActiveGroupId: vi.fn(),
    }
    renderProvider(repository)

    await user.click(screen.getByRole('button', { name: 'User 1' }))
    expect(await screen.findByText('ready:user-1:none')).toBeInTheDocument()
    expect(ensureUserProfile).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'User 1' }))
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(ensureUserProfile).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'User 2' }))
    expect(await screen.findByText('ready:user-2:none')).toBeInTheDocument()
    expect(ensureUserProfile).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(screen.getByText('idle:none:none')).toBeInTheDocument()
  })

  it('expõe erro sem logout e permite retry', async () => {
    const user = userEvent.setup()
    const ensureUserProfile = vi
      .fn()
      .mockRejectedValueOnce(new UserProfileError('unavailable'))
      .mockResolvedValueOnce(profile('user-1'))
    const repository: UserRepository = {
      ensureUserProfile,
      getUserProfile: vi.fn(),
      ensureActiveGroupId: vi.fn(),
      getActiveGroupId: vi.fn(),
    }
    renderProvider(repository)

    await user.click(screen.getByRole('button', { name: 'User 1' }))
    expect(
      await screen.findByText('error:none:unavailable'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() =>
      expect(screen.getByText('ready:user-1:none')).toBeInTheDocument(),
    )
    expect(ensureUserProfile).toHaveBeenCalledTimes(2)
  })
})
