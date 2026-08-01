import { describe, expect, it } from 'vitest'
import { MAX_MONEY_MINOR } from '../../../shared/money/money'
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPES } from './Transaction'
import { normalizeTransactionDescription } from './normalizeTransactionDescription'
import { createTransactionSchema } from './transactionSchemas'

const valid = {
  type: 'income',
  description: 'Salário',
  amountMinor: 100_000,
  accountId: 'account-1',
  categoryId: 'category-1',
  notes: null,
  competenceDate: '2026-07-31',
  dueDate: '2026-08-05',
  paymentDate: '2026-08-05',
}
describe('transaction domain', () => {
  it('mantém enum fechado e labels em português', () => {
    expect(TRANSACTION_TYPES).toEqual(['income', 'expense'])
    expect(TRANSACTION_TYPE_LABELS).toEqual({
      income: 'Receita',
      expense: 'Despesa',
    })
  })
  it('normaliza descrição e observação', () => {
    expect(normalizeTransactionDescription('  ÁGUA   e Luz ')).toBe(
      'agua e luz',
    )
    expect(
      createTransactionSchema.parse({
        ...valid,
        description: ' Salário ',
        notes: '  mensal  ',
      }),
    ).toMatchObject({ description: 'Salário', notes: 'mensal' })
  })
  it.each([0, -1, 1.5, MAX_MONEY_MINOR + 1])(
    'rejeita valor inválido %s',
    (amountMinor) => {
      expect(
        createTransactionSchema.safeParse({ ...valid, amountMinor }).success,
      ).toBe(false)
    },
  )
  it('aceita receita e despesa com valor positivo e notes opcional', () => {
    expect(createTransactionSchema.safeParse(valid).success).toBe(true)
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        type: 'expense',
        notes: '',
      }).success,
    ).toBe(true)
  })
  it('rejeita campos protegidos no input', () => {
    expect(
      createTransactionSchema.safeParse({
        ...valid,
        groupId: 'group-1',
        createdBy: 'user-1',
      }).success,
    ).toBe(false)
  })
  it.each(['2026-02-30', '2025-02-29', '31/07/2026', '', null])(
    'rejeita data de criação inválida %s',
    (competenceDate) => {
      expect(
        createTransactionSchema.safeParse({ ...valid, competenceDate }).success,
      ).toBe(false)
    },
  )
  it('exige as três datas em novos lançamentos', () => {
    const { paymentDate: _paymentDate, ...withoutPaymentDate } = valid
    void _paymentDate
    expect(createTransactionSchema.safeParse(withoutPaymentDate).success).toBe(
      false,
    )
  })
})
