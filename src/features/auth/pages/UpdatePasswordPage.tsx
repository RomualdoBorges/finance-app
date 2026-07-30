import { ArrowLeft, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'

import { routePaths } from '../../../routes/paths'
import { UpdatePasswordForm } from '../components/UpdatePasswordForm'
import { useAuth } from '../hooks/useAuth'

export function UpdatePasswordPage() {
  const { user } = useAuth()

  return (
    <section
      aria-labelledby="update-password-title"
      className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <KeyRound aria-hidden="true" className="mb-4 text-primary" size={32} />
      <h1
        className="text-2xl font-semibold tracking-tight"
        id="update-password-title"
      >
        Alterar senha
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Confirme sua senha atual antes de definir uma nova senha.
      </p>

      <div className="mt-7">
        {user?.email === null ? (
          <p
            className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm"
            role="alert"
          >
            Não foi possível atualizar a senha desta conta.
          </p>
        ) : (
          <UpdatePasswordForm />
        )}
      </div>

      <Link
        className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-md px-1 py-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        to={routePaths.home}
      >
        <ArrowLeft aria-hidden="true" size={18} />
        Voltar ao início
      </Link>
    </section>
  )
}
