import { Outlet } from 'react-router-dom'

import { AppSidebar } from '../components/navigation/AppSidebar'
import { MobileNavigation } from '../components/navigation/MobileNavigation'
import { ThemeSelector } from '../components/shared/ThemeSelector'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="fixed top-2 left-2 z-[60] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:translate-y-0"
        href="#conteudo-principal"
      >
        Pular para o conteúdo
      </a>
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-surface">
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNavigation />
            <span className="truncate font-semibold">Financeiro</span>
          </div>
          <div
            aria-label="Ações do usuário"
            className="flex items-center gap-2"
            role="group"
          >
            <ThemeSelector />
            <span className="hidden rounded-md border border-border px-3 py-2 text-sm font-medium sm:inline">
              Conta
            </span>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <AppSidebar />
        <main className="min-w-0 flex-1" id="conteudo-principal" tabIndex={-1}>
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
