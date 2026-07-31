import { z } from 'zod'
import { MAX_MONEY_MINOR } from '../../../shared/money/money'
import { TRANSACTION_TYPES } from './Transaction'

const identifier = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((v) => !v.includes('/'))

export const transactionIdentitySchema = z
  .object({
    groupId: identifier,
    userId: identifier,
  })
  .strict()

export const createTransactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, {
      message: 'Selecione Receita ou Despesa.',
    }),
    description: z
      .string()
      .trim()
      .min(2, 'Informe uma descrição com pelo menos 2 caracteres.')
      .max(120, 'Use no máximo 120 caracteres.'),
    amountMinor: z
      .number({ message: 'Informe um valor válido.' })
      .int('O valor deve usar centavos inteiros.')
      .positive('O valor deve ser maior que zero.')
      .max(MAX_MONEY_MINOR, 'O valor está acima do limite permitido.'),
    accountId: identifier,
    categoryId: identifier,
    notes: z
      .string()
      .trim()
      .max(500, 'Use no máximo 500 caracteres.')
      .nullish()
      .transform((value) => value || null),
  })
  .strict()
