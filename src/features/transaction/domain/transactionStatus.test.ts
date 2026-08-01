import { describe, expect, it } from 'vitest'
import {
  CREATABLE_TRANSACTION_STATUSES,
  DEFAULT_TRANSACTION_STATUS,
  PERSISTED_TRANSACTION_STATUSES,
  TRANSACTION_DISPLAY_STATUSES,
  getTransactionDisplayStatus,
  getTransactionStatusLabel,
  isTransactionOverdue,
} from './transactionStatus'

describe('transaction status', () => {
  it('centraliza contratos, default e labels', () => {
    expect(PERSISTED_TRANSACTION_STATUSES).toEqual([
      'planned',
      'pending',
      'confirmed',
      'canceled',
    ])
    expect(CREATABLE_TRANSACTION_STATUSES).toEqual([
      'planned',
      'pending',
      'confirmed',
    ])
    expect(TRANSACTION_DISPLAY_STATUSES).toContain('overdue')
    expect(DEFAULT_TRANSACTION_STATUS).toBe('pending')
    expect(TRANSACTION_DISPLAY_STATUSES.map(getTransactionStatusLabel)).toEqual(
      ['Planejado', 'Pendente', 'Confirmado', 'Cancelado', 'Vencido'],
    )
  })

  it.each([
    ['2026-07-30', 'overdue'],
    ['2026-07-31', 'pending'],
    ['2026-08-01', 'pending'],
  ] as const)(
    'deriva pending com vencimento %s como %s',
    (dueDate, expected) => {
      expect(
        getTransactionDisplayStatus(
          { status: 'pending', dueDate },
          '2026-07-31',
        ),
      ).toBe(expected)
    },
  )

  it.each(['planned', 'confirmed', 'canceled'] as const)(
    'não deriva %s como vencido',
    (status) => {
      expect(
        isTransactionOverdue({ status, dueDate: '2026-01-01' }, '2026-07-31'),
      ).toBe(false)
    },
  )

  it('mantém pending legado sem vencimento', () => {
    expect(
      getTransactionDisplayStatus(
        { status: 'pending', dueDate: null },
        '2026-07-31',
      ),
    ).toBe('pending')
  })

  it('rejeita today inválido', () => {
    expect(() =>
      isTransactionOverdue({ status: 'pending', dueDate: null }, '31/07/2026'),
    ).toThrow(TypeError)
  })
})
