import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../features/auth/domain/AuthenticatedUser'
import type { PersonalGroup } from '../features/group/domain/Group'
import { GroupError } from '../features/group/domain/GroupError'
import { useGroup } from '../features/group/hooks/useGroup'
import type { GroupRepository } from '../features/group/repositories/GroupRepository'
import { GroupService } from '../features/group/services/GroupService'
import type { UserProfile } from '../features/user/domain/UserProfile'
import { renderWithProviders } from '../test/render'
import { AuthContext } from './AuthContext'
import { GroupProvider } from './GroupProvider'
import { UserProfileContext } from './UserProfileContext'

const user: AuthenticatedUser = {
  uid: 'user-1',
  email: null,
  displayName: null,
  photoURL: null,
  emailVerified: true,
}
const timestamp = new Date('2026-01-01T00:00:00Z')
const personalGroup: PersonalGroup = {
  group: {
    id: 'user-1',
    name: 'Meu Financeiro',
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  membership: {
    id: 'user-1',
    groupId: 'user-1',
    userId: 'user-1',
    role: 'OWNER',
    createdAt: timestamp,
  },
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

function GroupProbe() {
  const { activeGroup, membership, status, error, refresh } = useGroup()
  return (
    <>
      <span>
        {status}:{activeGroup?.id ?? 'none'}:{membership?.role ?? 'none'}:
        {error?.code ?? 'none'}
      </span>
      <button type="button" onClick={() => void refresh()}>
        Tentar novamente
      </button>
    </>
  )
}

function renderProvider(repository: GroupRepository) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderWithProviders(
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
          <GroupProvider service={new GroupService(repository)}>
            <GroupProbe />
          </GroupProvider>
        </UserProfileContext.Provider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

function createRepository() {
  const ensurePersonalGroup = vi.fn().mockResolvedValue(personalGroup)
  const ensureActiveGroup = vi.fn().mockResolvedValue(profile)
  const getActiveGroup = vi.fn().mockResolvedValue(personalGroup.group)
  const repository: GroupRepository = {
    ensurePersonalGroup,
    getGroup: vi.fn(),
    getMembership: vi.fn(),
    ensureActiveGroup,
    getActiveGroup,
  }
  return {
    repository,
    ensurePersonalGroup,
    ensureActiveGroup,
    getActiveGroup,
  }
}

describe('GroupProvider', () => {
  it('executa o bootstrap em ordem e publica o grupo ativo', async () => {
    const {
      repository,
      ensurePersonalGroup,
      ensureActiveGroup,
      getActiveGroup,
    } = createRepository()
    renderProvider(repository)

    expect(
      await screen.findByText('ready:user-1:OWNER:none'),
    ).toBeInTheDocument()
    expect(ensurePersonalGroup).toHaveBeenCalledTimes(1)
    expect(ensureActiveGroup).toHaveBeenCalledWith('user-1', 'user-1')
    expect(getActiveGroup).toHaveBeenCalledWith('user-1')
    expect(ensurePersonalGroup.mock.invocationCallOrder[0]).toBeLessThan(
      ensureActiveGroup.mock.invocationCallOrder[0] ?? 0,
    )
    expect(ensureActiveGroup.mock.invocationCallOrder[0]).toBeLessThan(
      getActiveGroup.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('expõe erro sanitizado e refaz todo o bootstrap no retry', async () => {
    const userEventController = userEvent.setup()
    const { repository, ensureActiveGroup } = createRepository()
    ensureActiveGroup
      .mockRejectedValueOnce(new GroupError('unavailable'))
      .mockResolvedValueOnce(profile)
    renderProvider(repository)

    expect(
      await screen.findByText('error:none:none:unavailable'),
    ).toBeInTheDocument()
    await userEventController.click(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    )

    await waitFor(() =>
      expect(screen.getByText('ready:user-1:OWNER:none')).toBeInTheDocument(),
    )
    expect(ensureActiveGroup).toHaveBeenCalledTimes(2)
  })
})
