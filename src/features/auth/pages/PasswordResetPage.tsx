import { Link } from 'react-router-dom'

import { ThemeSelector } from '../../../components/shared/ThemeSelector'
import { routePaths } from '../../../routes/paths'
import { PasswordResetForm } from '../components/PasswordResetForm'

export function PasswordResetPage() {
  return (
    <section aria-labelledby="password-reset-title">
      <div className="mb-6 flex items-center justify-between gap-4">
        <span className="font-semibold">Financeiro</span>
        <ThemeSelector />
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
          id="password-reset-title"
        >
          Recuperar senha
        </h1>
        <p className="mt-2 mb-7 text-sm leading-6 text-muted-foreground">
          Informe seu e-mail para receber instruções de redefinição.
        </p>
        <PasswordResetForm />
        <p className="mt-6 text-center text-sm">
          <Link
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            to={routePaths.login}
          >
            Voltar ao login
          </Link>
        </p>
      </div>
    </section>
  )
}
