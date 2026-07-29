import { Link } from 'react-router-dom'

import { ThemeSelector } from '../../../components/shared/ThemeSelector'
import { routePaths } from '../../../routes/paths'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  return (
    <section aria-labelledby="login-title">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="font-semibold">Financeiro</span>
        <ThemeSelector />
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          id="login-title"
        >
          Entre na sua conta
        </h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-muted-foreground">
          Use seu e-mail e sua senha para continuar.
        </p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem uma conta?{' '}
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to={routePaths.register}
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </section>
  )
}
