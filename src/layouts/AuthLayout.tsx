import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10 text-foreground sm:px-6">
      <main className="w-full max-w-md" id="conteudo-principal">
        <Outlet />
      </main>
    </div>
  )
}
