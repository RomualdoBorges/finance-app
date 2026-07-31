import { describe, expect, it } from 'vitest'
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  getAccountTypeDefaults,
} from './accountTypes'

describe('accountTypes', () => {
  it('mantém enum fechado e rótulos em português', () => {
    expect(ACCOUNT_TYPES).toEqual([
      'checking',
      'savings',
      'cash',
      'credit_card',
      'investment',
      'digital_wallet',
      'other',
    ])
    expect(ACCOUNT_TYPE_LABELS).toEqual({
      checking: 'Conta corrente',
      savings: 'Poupança',
      cash: 'Dinheiro',
      credit_card: 'Cartão de crédito',
      investment: 'Investimento',
      digital_wallet: 'Carteira digital',
      other: 'Outra',
    })
  })

  it.each([
    ['checking', true, true],
    ['savings', true, true],
    ['cash', true, true],
    ['credit_card', false, true],
    ['investment', false, true],
    ['digital_wallet', true, true],
    ['other', true, true],
  ] as const)('define defaults de %s', (type, balance, netWorth) => {
    expect(getAccountTypeDefaults(type)).toEqual({
      includeInBalance: balance,
      includeInNetWorth: netWorth,
    })
  })
})
