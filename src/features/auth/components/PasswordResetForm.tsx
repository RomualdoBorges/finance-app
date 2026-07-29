import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '../../../components/ui/Button'
import { AuthError } from '../domain/AuthError'
import {
  passwordResetSchema,
  type PasswordResetFormValues,
} from '../domain/authSchemas'
import { useSendPasswordResetEmail } from '../hooks/useAuthMutations'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'

const successMessage =
  'Se existir uma conta para este e-mail, você receberá as instruções para redefinir sua senha.'

export function PasswordResetForm() {
  const mutation = useSendPasswordResetEmail()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '' },
    shouldFocusError: true,
  })

  const authError =
    mutation.error instanceof AuthError
      ? mutation.error.message
      : mutation.isError
        ? 'Não foi possível solicitar a recuperação de senha. Tente novamente.'
        : null

  if (mutation.isSuccess) {
    return (
      <div
        aria-live="polite"
        className="rounded-md border border-primary/40 bg-primary/10 px-4 py-4 text-sm text-foreground"
        role="status"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary"
            size={19}
          />
          <p>{successMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => {
          mutation.reset()
          mutation.mutate(values.email)
        })(event)
      }}
    >
      <AuthField
        autoComplete="email"
        error={errors.email?.message}
        id="password-reset-email"
        inputMode="email"
        label="E-mail"
        type="email"
        {...register('email')}
      />
      <AuthFormError message={authError} />
      <Button className="w-full" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? (
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
            size={18}
          />
        ) : null}
        {mutation.isPending ? 'Enviando…' : 'Enviar instruções'}
      </Button>
    </form>
  )
}
