import { createContext } from 'react'

import type { Group, GroupMember } from '../features/group/domain/Group'
import type { GroupError } from '../features/group/domain/GroupError'

export type GroupStatus = 'idle' | 'loading' | 'ready' | 'error'

export type GroupContextValue = {
  readonly group: Group | null
  readonly activeGroup: Group | null
  readonly membership: GroupMember | null
  readonly status: GroupStatus
  readonly error: GroupError | null
  readonly refresh: () => Promise<void>
}

export const GroupContext = createContext<GroupContextValue | null>(null)
