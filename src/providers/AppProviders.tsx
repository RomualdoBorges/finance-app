import type { ReactNode } from 'react'

import { services } from '../app/composition/services'
import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'
import { AuthProvider } from './AuthProvider'

type AppProvidersProps = {
  readonly children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider service={services.auth}>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
