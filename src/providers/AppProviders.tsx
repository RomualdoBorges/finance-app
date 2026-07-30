import type { ReactNode } from 'react'

import { services } from '../app/composition/services'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'
import { UserProfileProvider } from './UserProfileProvider'

type AppProvidersProps = {
  readonly children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider service={services.auth}>
          <UserProfileProvider service={services.user}>
            {children}
          </UserProfileProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
