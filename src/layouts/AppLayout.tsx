import { Outlet } from 'react-router-dom'

import { ThemeSelector } from '../components/shared/ThemeSelector'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <span className="font-semibold">Financeiro</span>
          <ThemeSelector />
        </div>
      </header>

      <main className="flex-1" id="conteudo-principal">
        <Outlet />
      </main>
    </div>
  )
}
