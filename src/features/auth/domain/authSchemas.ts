import { z } from 'zod'

export const minimumPasswordLength = 6

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
      .min(
        minimumPasswordLength,
        `A senha deve ter pelo menos ${minimumPasswordLength} caracteres.`,
      ),
    passwordConfirmation: z.string().min(1, 'Confirme a senha informada.'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    message: 'As senhas devem ser iguais.',
    path: ['passwordConfirmation'],
  })

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: z
      .string()
      .min(1, 'Informe a nova senha.')
      .min(
        minimumPasswordLength,
        `A nova senha deve ter pelo menos ${minimumPasswordLength} caracteres.`,
      ),
    confirmNewPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .superRefine((values, context) => {
    if (
      values.currentPassword.length > 0 &&
      values.currentPassword === values.newPassword
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A nova senha deve ser diferente da senha atual.',
        path: ['newPassword'],
      })
    }

    if (values.confirmNewPassword !== values.newPassword) {
      context.addIssue({
        code: 'custom',
        message: 'A confirmação da senha não corresponde à nova senha.',
        path: ['confirmNewPassword'],
      })
    }
  })

export const deleteCurrentUserSchema = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual.'),
  confirmation: z.boolean().refine((value) => value, {
    message: 'Confirme que você entende que esta ação é permanente.',
  }),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>
export type DeleteCurrentUserFormValues = z.infer<
  typeof deleteCurrentUserSchema
>
