import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../features/auth/domain/AuthenticatedUser'
import type {
  FinancialGroup,
  GroupMembership,
} from '../features/group/domain/Group'
import { GroupError } from '../features/group/domain/GroupError'
import { useGroup } from '../features/group/hooks/useGroup'
import { userProfileQueryKey } from '../features/user/queries/userProfileQueryKeys'
import type { UserProfile } from '../features/user/domain/UserProfile'
import { UserProfileError } from '../features/user/domain/UserProfileError'
import type { UserRepository } from '../features/user/repositories/UserRepository'
import { UserService } from '../features/user/services/UserService'
import { renderWithProviders } from '../test/render'
import { AuthContext } from './AuthContext'
import { GroupProvider } from './GroupProvider'
import { UserProfileProvider } from './UserProfileProvider'
import { UserProfileContext } from './UserProfileContext'

const user: AuthenticatedUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  emailVerified: true,
}
const timestamp = new Date('2026-01-01T00:00:00Z')
const group: FinancialGroup = {
  id: 'user-1',
  name: 'Meu Financeiro',
  type: 'personal',
  currency: 'BRL',
  ownerId: 'user-1',
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}
const membership: GroupMembership = {
  groupId: 'user-1',
  userId: 'user-1',
  role: 'owner',
  status: 'active',
  createdAt: timestamp,
  updatedAt: timestamp,
}
const profile: UserProfile = {
  id: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  activeGroupId: 'user-1',
  createdAt: timestamp,
  updatedAt: timestamp,
}

function Probe() {
  const {
    activeGroup,
    membership: currentMembership,
    status,
    error,
    refresh,
  } = useGroup()
  return (
    <>
      <span>
        {status}:{activeGroup?.id ?? 'none'}:{currentMembership?.role ?? 'none'}
        :{error?.code ?? 'none'}
      </span>
      <button type="button" onClick={() => void refresh()}>
        Tentar novamente
      </button>
    </>
  )
}

function renderProvider(bootstrapPersonalGroup: ReturnType<typeof vi.fn>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const service = { bootstrapPersonalGroup }
  const result = renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          status: 'authenticated',
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
        <UserProfileContext.Provider
          value={{
            profile: { ...profile, activeGroupId: null },
            status: 'ready',
            error: null,
            refreshProfile: vi.fn(),
          }}
        >
          <GroupProvider service={service as never}>
            <Probe />
          </GroupProvider>
        </UserProfileContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}

describe('GroupProvider', () => {
  it('inicia bootstrap quando um perfil legado chega a ready', async () => {
    const legacyProfile = { ...profile, displayName: 'Pessoa Legada' }
    const ensureUserProfile = vi.fn().mockResolvedValue(legacyProfile)
    const repository: UserRepository = {
      ensureUserProfile,
      getUserProfile: vi.fn(),
      ensureActiveGroupId: vi.fn(),
      getActiveGroupId: vi.fn(),
    }
    const bootstrap = vi
      .fn()
      .mockResolvedValue({ group, activeGroup: group, membership, profile })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            status: 'authenticated',
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
          <UserProfileProvider service={new UserService(repository)}>
            <GroupProvider
              service={{ bootstrapPersonalGroup: bootstrap } as never}
            >
              <Probe />
            </GroupProvider>
          </UserProfileProvider>
        </AuthContext.Provider>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('ready:user-1:owner:none'),
    ).toBeInTheDocument()
    expect(ensureUserProfile).toHaveBeenCalledOnce()
    expect(bootstrap).toHaveBeenCalledWith({ userId: 'user-1' })
  })

  it('não inicia bootstrap quando o perfil mantém erro real', async () => {
    const ensureUserProfile = vi
      .fn()
      .mockRejectedValue(new UserProfileError('permission-denied'))
    const repository: UserRepository = {
      ensureUserProfile,
      getUserProfile: vi.fn(),
      ensureActiveGroupId: vi.fn(),
      getActiveGroupId: vi.fn(),
    }
    const bootstrap = vi.fn()
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            status: 'authenticated',
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
          <UserProfileProvider service={new UserService(repository)}>
            <GroupProvider
              service={{ bootstrapPersonalGroup: bootstrap } as never}
            >
              <Probe />
            </GroupProvider>
          </UserProfileProvider>
        </AuthContext.Provider>
      </QueryClientProvider>,
    )

    await waitFor(() => expect(ensureUserProfile).toHaveBeenCalledOnce())
    expect(screen.getByText('idle:none:none:none')).toBeInTheDocument()
    expect(bootstrap).not.toHaveBeenCalled()
  })

  it('representa loading, ready e atualiza o cache do perfil', async () => {
    let resolveBootstrap:
      | ((value: {
          group: FinancialGroup
          activeGroup: FinancialGroup
          membership: GroupMembership
          profile: UserProfile
        }) => void)
      | undefined
    const bootstrap = vi.fn(
      () =>
        new Promise<{
          group: FinancialGroup
          activeGroup: FinancialGroup
          membership: GroupMembership
          profile: UserProfile
        }>((resolve) => {
          resolveBootstrap = resolve
        }),
    )
    const { queryClient } = renderProvider(bootstrap)
    expect(screen.getByText('loading:none:none:none')).toBeInTheDocument()

    resolveBootstrap?.({ group, activeGroup: group, membership, profile })
    expect(
      await screen.findByText('ready:user-1:owner:none'),
    ).toBeInTheDocument()
    expect(queryClient.getQueryData(userProfileQueryKey('user-1'))).toEqual(
      profile,
    )
  })

  it('expõe erro e refresh repete somente o caso de uso', async () => {
    const browser = userEvent.setup()
    const bootstrap = vi
      .fn()
      .mockRejectedValueOnce(new GroupError('unavailable'))
      .mockResolvedValueOnce({ group, activeGroup: group, membership, profile })
    renderProvider(bootstrap)

    expect(
      await screen.findByText('error:none:none:unavailable'),
    ).toBeInTheDocument()
    await browser.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    )
    await waitFor(() =>
      expect(screen.getByText('ready:user-1:owner:none')).toBeInTheDocument(),
    )
    expect(bootstrap).toHaveBeenCalledTimes(2)
  })
})
