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
        initialBalanceMinor: 123456,
        initialBalanceDate: '2026-07-31',
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
      initialBalanceMinor: 123456,
      initialBalanceDate: '2026-07-31',
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
        initialBalanceMinor: 0,
        initialBalanceDate: '2026-07-31',
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
        initialBalanceMinor: 0,
        initialBalanceDate: '2026-07-31',
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
        initialBalanceMinor: 0,
        initialBalanceDate: '2026-07-31',
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
        initialBalanceMinor: 0,
        initialBalanceDate: '2026-07-31',
      }).success,
    ).toBe(false)
  })
  it.each([
    { initialBalanceMinor: 1.5, initialBalanceDate: '2026-07-31' },
    { initialBalanceMinor: 0, initialBalanceDate: '31/07/2026' },
    { initialBalanceMinor: 0, initialBalanceDate: '2026-02-30' },
    {
      initialBalanceMinor: 9_000_000_000_001,
      initialBalanceDate: '2026-07-31',
    },
  ])('rejeita saldo ou data inicial inválidos', (financialFields) => {
    expect(
      createAccountSchema.safeParse({
        name: 'Conta',
        description: null,
        institutionName: null,
        icon: null,
        color: null,
        accountType: 'checking',
        includeInBalance: true,
        includeInNetWorth: true,
        ...financialFields,
      }).success,
    ).toBe(false)
  })
})
