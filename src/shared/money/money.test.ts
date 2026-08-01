import { describe, expect, it } from 'vitest'
import {
  formatMinorToCurrency,
  MAX_MONEY_MINOR,
  MIN_MONEY_MINOR,
  parseCurrencyToMinor,
  validateMinorAmount,
} from './money'

describe('money', () => {
  it.each([
    ['0', 0],
    ['0,00', 0],
    ['12', 1200],
    ['12,3', 1230],
    ['12,34', 1234],
    ['1.234,56', 123456],
    ['R$ 1.234,56', 123456],
    ['-1.234,56', -123456],
    ['+10,00', 1000],
  ])('converte %s exatamente para centavos', (input, expected) => {
    expect(parseCurrencyToMinor(input)).toBe(expected)
  })

  it.each(['', 'R$', '1.2', '1,234', '1,2,3', '1.23,45', 'NaN', 'Infinity'])(
    'rejeita entrada inválida %s',
    (input) => expect(parseCurrencyToMinor(input)).toBeNull(),
  )

  it('não arredonda e respeita os limites seguros', () => {
    expect(validateMinorAmount(1.5)).toBe(false)
    expect(validateMinorAmount(MIN_MONEY_MINOR)).toBe(true)
    expect(validateMinorAmount(MAX_MONEY_MINOR)).toBe(true)
    expect(validateMinorAmount(MAX_MONEY_MINOR + 1)).toBe(false)
    expect(parseCurrencyToMinor('90.000.000.000,00')).toBe(MAX_MONEY_MINOR)
    expect(parseCurrencyToMinor('90.000.000.000,01')).toBeNull()
  })

  it('formata centavos como BRL em pt-BR', () => {
    expect(formatMinorToCurrency(123456)).toBe('R$ 1.234,56')
    expect(formatMinorToCurrency(-50)).toBe('-R$ 0,50')
  })
})
