import type { ReactNode } from 'react'

import { QueryProvider } from './QueryProvider'
import { ThemeProvider } from './ThemeProvider'

type AppProvidersProps = {
  readonly children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  )
}
