import { useContext } from 'react'

import { GroupContext } from '../../../providers/GroupContext'

export function useGroup() {
  const context = useContext(GroupContext)
  if (context === null) {
    throw new Error('useGroup must be used within GroupProvider')
  }
  return context
}
