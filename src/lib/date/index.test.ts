import { describe, expect, it } from 'vitest'

import {
  formatCivilDateBR,
  formatDateBR,
  formatMonthYearBR,
  getMonthKey,
  getTodayCivilDate,
  isValidCivilDate,
} from '.'

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

  it.each(['2024-02-29', '2000-02-29', '2026-07-31'])(
    'aceita a data civil real %s',
    (value) => expect(isValidCivilDate(value)).toBe(true),
  )

  it.each([
    '2026-02-30',
    '2025-02-29',
    '1900-02-29',
    '2026-13-01',
    '2026-7-01',
  ])('rejeita a data civil inválida %s', (value) =>
    expect(isValidCivilDate(value)).toBe(false),
  )

  it('calcula e formata data civil pelo calendário local sem parsing UTC', () => {
    const localDate = new Date(2026, 6, 31, 23, 59)
    expect(getTodayCivilDate(localDate)).toBe('2026-07-31')
    expect(formatCivilDateBR('2026-07-31')).toBe('31/07/2026')
    expect(() => formatCivilDateBR('2026-02-30')).toThrow(RangeError)
  })
})
