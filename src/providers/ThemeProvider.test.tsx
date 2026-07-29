import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ThemeSelector } from '../components/shared/ThemeSelector'
import { interfacePreferencesStorageKey } from '../lib/theme'
import { useInterfacePreferencesStore } from '../stores/interfacePreferencesStore'
import { renderWithProviders } from '../test/render'

type ThemeChangeListener = (event: MediaQueryListEvent) => void

function mockSystemTheme(prefersDark: boolean) {
  let listener: ThemeChangeListener | undefined
  const mediaQuery = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, callback: ThemeChangeListener) => {
      listener = callback
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  } as unknown as MediaQueryList

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQuery),
  )

  return {
    change(matches: boolean) {
      listener?.({ matches } as MediaQueryListEvent)
    },
  }
}

afterEach(() => {
  act(() => {
    useInterfacePreferencesStore.setState({ theme: 'system' })
  })
})

describe('tema da interface', () => {
  it('alterna entre claro, escuro e sistema e persiste a preferência', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemeSelector />)

    await user.click(screen.getByRole('button', { name: /Selecionar tema/ }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Escuro' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(interfacePreferencesStorageKey)).toBe(
      JSON.stringify({ theme: 'dark' }),
    )

    await user.click(screen.getByRole('button', { name: /Tema atual: Escuro/ }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Claro' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    await user.click(screen.getByRole('button', { name: /Tema atual: Claro/ }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Sistema' }))
    expect(useInterfacePreferencesStore.getState().theme).toBe('system')
  })

  it('acompanha mudanças do sistema quando a preferência é sistema', () => {
    const systemTheme = mockSystemTheme(false)
    renderWithProviders(<ThemeSelector />)

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')

    act(() => {
      systemTheme.change(true)
    })

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })
})
