import { NavigationItems } from './NavigationItems'

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
      <nav aria-label="Navegação principal" className="sticky top-16 p-4">
        <NavigationItems />
        <p className="mt-6 border-t border-border px-3 pt-5 text-xs text-muted-foreground">
          Novos módulos serão adicionados nas próximas etapas.
        </p>
      </nav>
    </aside>
  )
}
