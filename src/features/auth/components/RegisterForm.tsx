import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '../../../components/ui/Button'
import { AuthError } from '../domain/AuthError'
import { registerSchema, type RegisterFormValues } from '../domain/authSchemas'
import { useRegisterWithEmailAndPassword } from '../hooks/useAuthMutations'
import { AuthField } from './AuthField'
import { AuthFormError } from './AuthFormError'

export function RegisterForm() {
  const mutation = useRegisterWithEmailAndPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', passwordConfirmation: '' },
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
          mutation.mutate({ email: values.email, password: values.password })
        })(event)
      }}
    >
      <AuthField
        autoComplete="email"
        error={errors.email?.message}
        id="register-email"
        inputMode="email"
        label="E-mail"
        type="email"
        {...register('email')}
      />
      <AuthField
        allowPasswordVisibility
        autoComplete="new-password"
        error={errors.password?.message}
        id="register-password"
        label="Senha"
        type="password"
        {...register('password')}
      />
      <AuthField
        allowPasswordVisibility
        autoComplete="new-password"
        error={errors.passwordConfirmation?.message}
        id="register-password-confirmation"
        label="Confirme a senha"
        type="password"
        {...register('passwordConfirmation')}
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
        {mutation.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
