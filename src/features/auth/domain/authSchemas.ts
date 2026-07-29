import { z } from 'zod'

const requiredEmailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .email('Informe um e-mail válido.')

export const loginSchema = z.object({
  email: requiredEmailSchema,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const passwordResetSchema = z.object({
  email: requiredEmailSchema,
})

export const registerSchema = z
  .object({
    email: requiredEmailSchema,
    password: z
      .string()
      .min(1, 'Informe uma senha.')
      .min(6, 'A senha deve ter pelo menos 6 caracteres.'),
    passwordConfirmation: z.string().min(1, 'Confirme a senha informada.'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'As senhas devem ser iguais.',
    path: ['passwordConfirmation'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
