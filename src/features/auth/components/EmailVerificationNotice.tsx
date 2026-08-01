import { MailWarning } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { routePaths } from '../../../routes/paths'

export function EmailVerificationNotice() {
  const { user } = useAuth()
  const location = useLocation()

  if (
    user === null ||
    user.emailVerified ||
    location.pathname === routePaths.emailVerification
  ) {
    return null
  }

  return (
    <div
      className="border-b border-primary/30 bg-primary/10 px-4 py-3 text-foreground sm:px-6"
      role="status"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <MailWarning aria-hidden="true" className="shrink-0" size={20} />
        <p className="min-w-0 flex-1 text-sm">
          Seu e-mail ainda não foi verificado.
        </p>
        <Link
          className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          to={routePaths.emailVerification}
        >
          Verificar e-mail
        </Link>
      </div>
    </div>
  )
}
