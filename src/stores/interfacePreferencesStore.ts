import { create } from 'zustand'

import { getStoredTheme, persistTheme } from '../lib/theme'
import type { Theme } from '../schemas/interfacePreferencesSchema'

type InterfacePreferencesState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useInterfacePreferencesStore = create<InterfacePreferencesState>()(
  (set) => ({
    theme: getStoredTheme(),
    setTheme: (theme) => {
      persistTheme(theme)
      set({ theme })
    },
  }),
)
