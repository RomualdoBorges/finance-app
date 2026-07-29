import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'

import type { Theme } from '../../schemas/interfacePreferencesSchema'
import { useInterfacePreferencesStore } from '../../stores/interfacePreferencesStore'

type ThemeSelectorProps = {
  className?: string
}

const themeOptions = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Escuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
] as const satisfies ReadonlyArray<{
  value: Theme
  label: string
  Icon: typeof Sun
}>

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const theme = useInterfacePreferencesStore((state) => state.theme)
  const setTheme = useInterfacePreferencesStore((state) => state.setTheme)
  const currentTheme =
    themeOptions.find((option) => option.value === theme) ?? themeOptions[2]
  const CurrentThemeIcon = currentTheme.Icon

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={[
          'inline-flex items-center gap-2 rounded-md border border-current px-3 py-2 text-sm',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={`Selecionar tema. Tema atual: ${currentTheme.label}`}
      >
        <CurrentThemeIcon aria-hidden="true" size={18} />
        <span>{currentTheme.label}</span>
        <ChevronDown aria-hidden="true" size={16} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        className="mt-1 min-w-40 rounded-md border bg-white p-1 text-neutral-900 shadow-md"
        align="end"
      >
        <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium">
          Tema
        </DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          value={theme}
          onValueChange={(value) => {
            setTheme(value as Theme)
          }}
        >
          {themeOptions.map(({ value, label, Icon }) => (
            <DropdownMenu.RadioItem
              key={value}
              value={value}
              className="relative flex cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-none data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-950"
            >
              <Icon aria-hidden="true" size={16} />
              <span>{label}</span>
              <DropdownMenu.ItemIndicator className="absolute right-2 inline-flex">
                <Check aria-hidden="true" size={16} />
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
