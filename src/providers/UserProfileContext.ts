import { createContext } from 'react'

import type { UserProfile } from '../features/user/domain/UserProfile'
import type { UserProfileError } from '../features/user/domain/UserProfileError'

export type UserProfileStatus = 'idle' | 'loading' | 'ready' | 'error'

export type UserProfileContextValue = {
  readonly profile: UserProfile | null
  readonly status: UserProfileStatus
  readonly error: UserProfileError | null
  readonly refreshProfile: () => Promise<void>
}

export const UserProfileContext = createContext<UserProfileContextValue | null>(
  null,
)
