import { CheckCircle2, LoaderCircle, MailCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '../../../components/ui/Button'
import { routePaths } from '../../../routes/paths'
import { AuthError } from '../domain/AuthError'
import { useAuth } from '../hooks/useAuth'
import {
  useReloadAuthenticatedUser,
  useSendVerificationEmail,
} from '../hooks/useAuthMutations'

const resendCooldownSeconds = 60

function mutationErrorMessage(error: Error | null) {
  return error instanceof AuthError
    ? error.message
    : 'Não foi possível concluir a solicitação. Tente novamente.'
}

export function EmailVerificationPage() {
  const { user } = useAuth()
  const sendVerification = useSendVerificationEmail()
  const reloadUser = useReloadAuthenticatedUser()
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown === 0) return

    const interval = window.setInterval(() => {
      setCooldown((remaining) => Math.max(remaining - 1, 0))
    }, 1000)

    return () => window.clearInterval(interval)
  }, [cooldown])

  if (user?.emailVerified) {
    return (
      <section
        aria-labelledby="email-verification-title"
        className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <CheckCircle2
          aria-hidden="true"
          className="mb-4 text-primary"
          size={32}
        />
        <h1
          className="text-2xl font-semibold tracking-tight"
          id="email-verification-title"
        >
          E-mail verificado
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Seu endereço de e-mail foi confirmado com sucesso.
        </p>
        <Link
          className="mt-6 inline-flex min-h-10 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          to={routePaths.home}
        >
          Continuar
        </Link>
      </section>
    )
  }

  const error = sendVerification.error ?? reloadUser.error
  const waitingForResend = cooldown > 0

  return (
    <section
      aria-labelledby="email-verification-title"
      className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
    >
      <MailCheck aria-hidden="true" className="mb-4 text-primary" size={32} />
      <h1
        className="text-2xl font-semibold tracking-tight"
        id="email-verification-title"
      >
        Verifique seu e-mail
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Envie uma mensagem de verificação
        {user?.email ? (
          <>
            {' '}
            para <strong className="text-foreground">{user.email}</strong>
          </>
        ) : null}
        , abra o link recebido e volte aqui para atualizar o estado.
      </p>

      {sendVerification.isSuccess ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm"
          role="status"
        >
          E-mail de verificação enviado.
        </p>
      ) : null}
      {reloadUser.isSuccess && !reloadUser.data.emailVerified ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-md border border-border bg-muted px-4 py-3 text-sm"
          role="status"
        >
          O e-mail ainda não aparece como verificado. Conclua a verificação e
          tente novamente.
        </p>
      ) : null}
      {error ? (
        <p
          aria-live="assertive"
          className="mt-5 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm"
          role="alert"
        >
          {mutationErrorMessage(error)}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          disabled={reloadUser.isPending}
          onClick={() => {
            sendVerification.reset()
            reloadUser.mutate()
          }}
        >
          {reloadUser.isPending ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={18}
            />
          ) : null}
          {reloadUser.isPending ? 'Atualizando…' : 'Já verifiquei meu e-mail'}
        </Button>
        <Button
          disabled={sendVerification.isPending || waitingForResend}
          onClick={() => {
            reloadUser.reset()
            sendVerification.mutate(undefined, {
              onSuccess: () => setCooldown(resendCooldownSeconds),
            })
          }}
          variant="secondary"
        >
          {sendVerification.isPending
            ? 'Enviando…'
            : waitingForResend
              ? `Reenviar em ${cooldown}s`
              : sendVerification.isSuccess
                ? 'Reenviar e-mail'
                : 'Enviar e-mail de verificação'}
        </Button>
      </div>
    </section>
  )
}
