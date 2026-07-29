import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema } from './authSchemas'

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
})
