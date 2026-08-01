import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react'

import {
  themeSchema,
  type Theme,
} from '../../schemas/interfacePreferencesSchema'
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
          'inline-flex w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground',
          'hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
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
        className="mt-1 min-w-44 rounded-md border border-border bg-surface p-1 text-foreground shadow-lg"
        align="end"
      >
        <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Tema
        </DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          value={theme}
          onValueChange={(value) => {
            const result = themeSchema.safeParse(value)

            if (result.success) {
              setTheme(result.data)
            }
          }}
        >
          {themeOptions.map(({ value, label, Icon }) => (
            <DropdownMenu.RadioItem
              key={value}
              value={value}
              className="relative flex cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-2 text-sm outline-none data-[state=checked]:font-semibold data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
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
