import { describe, expect, it } from 'vitest'
import { createAccountSchema, updateAccountSchema } from './accountSchemas'
import { normalizeAccountName } from './normalizeAccountName'

describe('accountSchemas', () => {
  it('normaliza espaços e acentos para comparação', () => {
    expect(normalizeAccountName('  Conta   Ágil  ')).toBe('conta agil')
  })
  it('aceita somente o payload mínimo válido', () => {
    expect(
      createAccountSchema.parse({
        name: 'Conta principal',
        description: '',
        institutionName: 'Banco',
        icon: 'landmark',
        color: '#2563eb',
      }),
    ).toEqual({
      name: 'Conta principal',
      description: null,
      institutionName: 'Banco',
      icon: 'landmark',
      color: '#2563eb',
    })
  })
  it.each([
    [
      {
        name: '',
        description: null,
        institutionName: null,
        icon: null,
        color: null,
      },
    ],
    [
      {
        name: 'a'.repeat(61),
        description: null,
        institutionName: null,
        icon: null,
        color: null,
      },
    ],
    [
      {
        name: 'Conta',
        description: null,
        institutionName: null,
        icon: null,
        color: null,
        currentBalance: 0,
      },
    ],
  ])('rejeita entrada inválida ou campo extra', (input) => {
    expect(createAccountSchema.safeParse(input).success).toBe(false)
  })
  it('exige identificador na edição', () => {
    expect(
      updateAccountSchema.safeParse({
        name: 'Conta',
        description: null,
        institutionName: null,
        icon: null,
        color: null,
      }).success,
    ).toBe(false)
  })
})
