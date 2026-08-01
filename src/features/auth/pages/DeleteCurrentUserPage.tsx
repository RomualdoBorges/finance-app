import { Trash2 } from 'lucide-react'

import { DeleteCurrentUserForm } from '../components/DeleteCurrentUserForm'
import { useAuth } from '../hooks/useAuth'

export function DeleteCurrentUserPage() {
  const { user } = useAuth()

  return (
    <section
      aria-labelledby="delete-account-title"
      className="mx-auto max-w-2xl rounded-xl border border-danger/40 bg-surface p-6 shadow-sm sm:p-8"
    >
      <Trash2 aria-hidden="true" className="mb-4 text-danger" size={32} />
      <h1
        className="text-2xl font-semibold tracking-tight"
        id="delete-account-title"
      >
        Excluir conta
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        A exclusão removerá permanentemente sua conta de autenticação.
      </p>

      <div className="mt-7">
        {user?.email === null ? (
          <p
            className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm"
            role="alert"
          >
            Não foi possível excluir a conta desta sessão.
          </p>
        ) : (
          <DeleteCurrentUserForm />
        )}
      </div>
    </section>
  )
}
