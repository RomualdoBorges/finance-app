import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '../../../components/ui/Button'
import { AuthError } from '../domain/AuthError'
import { loginSchema, type LoginFormValues } from '../domain/authSchemas'
import { useSignInWithEmailAndPassword } from '../hooks/useAuthMutations'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'

export function LoginForm() {
  const mutation = useSignInWithEmailAndPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    shouldFocusError: true,
  })

  const authError =
    mutation.error instanceof AuthError
      ? mutation.error.message
      : mutation.isError
        ? 'Não foi possível concluir a autenticação. Tente novamente.'
        : null

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        void handleSubmit((values) => {
          mutation.reset()
          mutation.mutate(values)
        })(event)
      }}
    >
      <AuthField
        autoComplete="email"
        error={errors.email?.message}
        id="login-email"
        inputMode="email"
        label="E-mail"
        type="email"
        {...register('email')}
      />
      <AuthField
        allowPasswordVisibility
        autoComplete="current-password"
        error={errors.password?.message}
        id="login-password"
        label="Senha"
        type="password"
        {...register('password')}
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
        {mutation.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
