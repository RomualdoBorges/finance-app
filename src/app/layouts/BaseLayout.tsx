import { Outlet } from 'react-router-dom'

export function BaseLayout() {
  return (
    <div className="app-layout">
      <main className="app-main" id="conteudo-principal">
        <Outlet />
      </main>
    </div>
  )
}
