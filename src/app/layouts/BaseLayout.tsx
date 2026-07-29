import { Outlet } from 'react-router-dom'

export function BaseLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main id="conteudo-principal">
        <Outlet />
      </main>
    </div>
  )
}
