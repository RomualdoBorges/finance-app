import {
  interfacePreferencesSchema,
  type Theme,
} from '../schemas/interfacePreferencesSchema'

export const interfacePreferencesStorageKey =
  'finance-app:interface-preferences'

const darkThemeMediaQuery = '(prefers-color-scheme: dark)'

export function getStoredTheme(): Theme {
  try {
    const storedPreferences = localStorage.getItem(
      interfacePreferencesStorageKey,
    )

    if (!storedPreferences) {
      return 'system'
    }

    const result = interfacePreferencesSchema.safeParse(
      JSON.parse(storedPreferences),
    )

    return result.success ? result.data.theme : 'system'
  } catch {
    return 'system'
  }
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(
      interfacePreferencesStorageKey,
      JSON.stringify({ theme }),
    )
  } catch {
    // A preferência continua válida durante a sessão se o armazenamento falhar.
  }
}

export function getSystemThemeQuery() {
  return window.matchMedia(darkThemeMediaQuery)
}

export function applyTheme(theme: Theme, systemPrefersDark?: boolean) {
  const prefersDark = systemPrefersDark ?? getSystemThemeQuery().matches
  const resolvedTheme =
    theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme

  document.documentElement.setAttribute('data-theme', resolvedTheme)
  document.documentElement.style.colorScheme = resolvedTheme
}
