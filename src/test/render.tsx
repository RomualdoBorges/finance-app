import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  type RenderOptions,
  type RenderResult,
} from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { ThemeProvider } from '../providers/ThemeProvider'

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  readonly initialEntries?: readonly string[]
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...renderOptions }: RenderWithProvidersOptions = {},
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  function TestProviders({ children }: { readonly children: ReactNode }) {
    return (
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[...initialEntries]}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>
    )
  }

  return render(ui, { wrapper: TestProviders, ...renderOptions })
}
