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
})
