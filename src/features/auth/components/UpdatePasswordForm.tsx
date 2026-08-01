import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '../../../components/ui/Button'
import { AuthError } from '../domain/AuthError'
import {
  updatePasswordSchema,
  type UpdatePasswordFormValues,
} from '../domain/authSchemas'
import { useUpdatePassword } from '../hooks/useAuthMutations'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'

export function UpdatePasswordForm() {
  const mutation = useUpdatePassword()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    shouldFocusError: true,
  })

  const authError =
    mutation.error instanceof AuthError
      ? mutation.error.message
      : mutation.isError
        ? 'Não foi possível atualizar a senha. Tente novamente.'
        : null

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => {
          mutation.reset()
          mutation.mutate(
            {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            },
            {
              onSuccess: () => reset(),
            },
          )
        })(event)
      }}
    >
      <AuthField
        allowPasswordVisibility
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        id="update-password-current"
        label="Senha atual"
        type="password"
        {...register('currentPassword')}
      />
      <AuthField
        allowPasswordVisibility
        autoComplete="new-password"
        error={errors.newPassword?.message}
        id="update-password-new"
        label="Nova senha"
        type="password"
        {...register('newPassword')}
      />
      <AuthField
        allowPasswordVisibility
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        id="update-password-confirmation"
        label="Confirmar nova senha"
        type="password"
        {...register('confirmNewPassword')}
      />

      <AuthFormError message={authError} />
      {mutation.isSuccess ? (
        <div
          aria-live="polite"
          className="flex items-start gap-3 rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-primary"
            size={19}
          />
          <p>Senha atualizada com sucesso.</p>
        </div>
      ) : null}

      <Button
        className="w-full sm:w-auto"
        disabled={mutation.isPending}
        type="submit"
      >
        {mutation.isPending ? (
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
            size={18}
          />
        ) : null}
        {mutation.isPending ? 'Atualizando...' : 'Atualizar senha'}
      </Button>
    </form>
  )
}
