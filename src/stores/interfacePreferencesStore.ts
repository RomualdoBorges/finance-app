import { create } from 'zustand'

import type { Theme } from '../schemas/interfacePreferencesSchema'

type InterfacePreferencesState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useInterfacePreferencesStore = create<InterfacePreferencesState>()(
  (set) => ({
    theme: 'system',
    setTheme: (theme) => {
      set({ theme })
    },
  }),
)
