import { describe, expect, it } from 'vitest'

import {
  loginSchema,
  passwordResetSchema,
  registerSchema,
  updatePasswordSchema,
} from './authSchemas'

describe('schemas de autenticação', () => {
  it('aceita um login válido', () => {
    expect(
      loginSchema.safeParse({
        email: 'pessoa@example.com',
        password: 'segredo',
      }).success,
    ).toBe(true)
  })

  it('rejeita e-mail inválido no login', () => {
    expect(
      loginSchema.safeParse({ email: 'invalido', password: 'segredo' }).success,
    ).toBe(false)
  })

  it('rejeita senha vazia no login', () => {
    expect(
      loginSchema.safeParse({ email: 'pessoa@example.com', password: '' })
        .success,
    ).toBe(false)
  })

  it('normaliza e aceita o e-mail da recuperação', () => {
    expect(
      passwordResetSchema.parse({ email: '  pessoa@example.com  ' }),
    ).toEqual({ email: 'pessoa@example.com' })
  })

  it.each(['', 'invalido'])(
    'rejeita e-mail inválido na recuperação: %s',
    (email) => {
      expect(passwordResetSchema.safeParse({ email }).success).toBe(false)
    },
  )

  it('aceita um cadastro válido', () => {
    expect(
      registerSchema.safeParse({
        email: 'pessoa@example.com',
        password: 'segredo',
        passwordConfirmation: 'segredo',
      }).success,
    ).toBe(true)
  })

  it('rejeita senha de cadastro com menos de 6 caracteres', () => {
    expect(
      registerSchema.safeParse({
        email: 'pessoa@example.com',
        password: '12345',
        passwordConfirmation: '12345',
      }).success,
    ).toBe(false)
  })

  it('rejeita confirmação diferente da senha', () => {
    const result = registerSchema.safeParse({
      email: 'pessoa@example.com',
      password: 'segredo',
      passwordConfirmation: 'diferente',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['passwordConfirmation'])
    }
  })

  it('aceita uma atualização de senha válida', () => {
    expect(
      updatePasswordSchema.safeParse({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova',
        confirmNewPassword: 'senha-nova',
      }).success,
    ).toBe(true)
  })

  it.each([
    [
      {
        currentPassword: '',
        newPassword: 'senha-nova',
        confirmNewPassword: 'senha-nova',
      },
      'Informe sua senha atual.',
    ],
    [
      {
        currentPassword: 'senha-atual',
        newPassword: '',
        confirmNewPassword: '',
      },
      'Informe a nova senha.',
    ],
    [
      {
        currentPassword: 'senha-atual',
        newPassword: '12345',
        confirmNewPassword: '12345',
      },
      'A nova senha deve ter pelo menos 6 caracteres.',
    ],
    [
      {
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova',
        confirmNewPassword: 'diferente',
      },
      'A confirmação da senha não corresponde à nova senha.',
    ],
    [
      {
        currentPassword: 'senha-igual',
        newPassword: 'senha-igual',
        confirmNewPassword: 'senha-igual',
      },
      'A nova senha deve ser diferente da senha atual.',
    ],
  ])('rejeita atualização inválida: %s', (input, expectedMessage) => {
    const result = updatePasswordSchema.safeParse(input)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        expectedMessage,
      )
    }
  })
})
