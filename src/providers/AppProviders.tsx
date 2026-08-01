import type { ReactNode } from 'react'

import { services } from '../app/composition/services'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { UserProfileProvider } from './UserProfileProvider'
import { GroupProvider } from './GroupProvider'

type AppProvidersProps = {
  readonly children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider service={services.auth}>
          <UserProfileProvider service={services.user}>
            <GroupProvider service={services.group}>{children}</GroupProvider>
          </UserProfileProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
