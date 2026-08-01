import { useContext } from 'react'

import { UserProfileContext } from '../../../providers/UserProfileContext'

export function useUserProfile() {
  const context = useContext(UserProfileContext)

  if (context === null) {
    throw new Error('useUserProfile must be used within UserProfileProvider')
  }

  return context
}
