import { describe, expect, it } from 'vitest'

import { formatDateBR, formatMonthYearBR, getMonthKey } from '.'

describe('utilitários de data', () => {
  const localCalendarDate = new Date(2026, 6, 29, 12)

  it('formata uma data no padrão brasileiro', () => {
    expect(formatDateBR(localCalendarDate)).toBe('29/07/2026')
  })

  it('formata o mês e cria sua chave no calendário local', () => {
    expect(formatMonthYearBR(localCalendarDate)).toBe('julho de 2026')
    expect(getMonthKey(localCalendarDate)).toBe('2026-07')
  })

  it('rejeita uma data inválida', () => {
    expect(() => formatDateBR(Number.NaN)).toThrow(RangeError)
  })
})
