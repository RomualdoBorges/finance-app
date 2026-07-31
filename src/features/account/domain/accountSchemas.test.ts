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
        accountType: 'checking',
        includeInBalance: true,
        includeInNetWorth: true,
      }),
    ).toEqual({
      name: 'Conta principal',
      description: null,
      institutionName: 'Banco',
      icon: 'landmark',
      color: '#2563eb',
      accountType: 'checking',
      includeInBalance: true,
      includeInNetWorth: true,
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
        accountType: 'checking',
        includeInBalance: true,
        includeInNetWorth: true,
      },
    ],
    [
      {
        name: 'a'.repeat(61),
        description: null,
        institutionName: null,
        icon: null,
        color: null,
        accountType: 'checking',
        includeInBalance: true,
        includeInNetWorth: true,
      },
    ],
    [
      {
        name: 'Conta',
        description: null,
        institutionName: null,
        icon: null,
        color: null,
        accountType: 'invalid',
        includeInBalance: true,
        includeInNetWorth: true,
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
        accountType: 'checking',
        includeInBalance: true,
        includeInNetWorth: true,
      }).success,
    ).toBe(false)
  })
})
