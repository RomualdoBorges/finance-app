import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button } from '../../../components/ui/Button'
import { routePaths } from '../../../routes/paths'
import { AuthError } from '../domain/AuthError'
import {
  deleteCurrentUserSchema,
  type DeleteCurrentUserFormValues,
} from '../domain/authSchemas'
import { useDeleteCurrentUser } from '../hooks/useAuthMutations'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'

export function DeleteCurrentUserForm() {
  const mutation = useDeleteCurrentUser()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteCurrentUserFormValues>({
    resolver: zodResolver(deleteCurrentUserSchema),
    defaultValues: { currentPassword: '', confirmation: false },
    shouldFocusError: true,
  })

  const authError =
    mutation.error instanceof AuthError
      ? mutation.error.message
      : mutation.isError
        ? 'Não foi possível excluir a conta. Tente novamente.'
        : null

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => {
          mutation.reset()
          mutation.mutate({ currentPassword: values.currentPassword })
        })(event)
      }}
    >
      <AuthField
        allowPasswordVisibility
        autoComplete="current-password"
        error={errors['currentPassword']?.message}
        id="delete-account-current-password"
        label="Senha atual"
        type="password"
        {...register('currentPassword')}
      />

      <div>
        <label
          className="flex items-start gap-3 text-sm"
          htmlFor="delete-account-confirmation"
        >
          <input
            aria-describedby={
              errors.confirmation === undefined
                ? undefined
                : 'delete-account-confirmation-error'
            }
            aria-invalid={errors.confirmation === undefined ? undefined : true}
            className="mt-0.5 size-4 shrink-0 accent-primary"
            id="delete-account-confirmation"
            type="checkbox"
            {...register('confirmation')}
          />
          <span>Entendo que esta ação é permanente.</span>
        </label>
        {errors.confirmation === undefined ? null : (
          <p
            className="mt-2 text-sm text-danger"
            id="delete-account-confirmation-error"
          >
            {errors.confirmation.message}
          </p>
        )}
      </div>

      <AuthFormError message={authError} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          className="sm:w-auto"
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
          {mutation.isPending ? 'Excluindo...' : 'Excluir conta'}
        </Button>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          to={routePaths.home}
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
