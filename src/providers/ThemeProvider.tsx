import { useEffect, type ReactNode } from 'react'

import { applyTheme, getSystemThemeQuery } from '../lib/theme'
import { useInterfacePreferencesStore } from '../stores/interfacePreferencesStore'

type ThemeProviderProps = {
  readonly children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useInterfacePreferencesStore((state) => state.theme)

  useEffect(() => {
    const systemThemeQuery = getSystemThemeQuery()

    applyTheme(theme, systemThemeQuery.matches)

    if (theme !== 'system') {
      return
    }

    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      applyTheme('system', event.matches)
    }

    systemThemeQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      systemThemeQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [theme])

  return children
}
