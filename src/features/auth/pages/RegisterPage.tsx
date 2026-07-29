import { Link } from 'react-router-dom'

import { ThemeSelector } from '../../../components/shared/ThemeSelector'
import { routePaths } from '../../../routes/paths'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  return (
    <section aria-labelledby="register-title">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="font-semibold">Financeiro</span>
        <ThemeSelector />
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          id="register-title"
        >
          Crie sua conta
        </h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-muted-foreground">
          Cadastre-se apenas com e-mail e senha.
        </p>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline"
            to={routePaths.login}
          >
            Entrar
          </Link>
        </p>
      </div>
    </section>
  )
}
