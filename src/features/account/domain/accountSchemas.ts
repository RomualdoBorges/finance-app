import { z } from 'zod'
import { ACCOUNT_TYPES } from './accountTypes'
import { MAX_MONEY_MINOR, MIN_MONEY_MINOR } from '../../../shared/money/money'

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) => !value.includes('/'))
const optionalText = (maximum: number, message: string) =>
  z
    .string()
    .trim()
    .max(maximum, message)
    .nullish()
    .transform((value) => value || null)

export const accountIdentitySchema = z
  .object({
    groupId: identifierSchema,
    userId: identifierSchema,
  })
  .strict()

export const createAccountSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Informe um nome com pelo menos 2 caracteres.')
      .max(60, 'Use no máximo 60 caracteres.')
      .refine(
        (value) => /[\p{L}\p{N}]/u.test(value),
        'O nome deve conter ao menos uma letra ou número.',
      ),
    description: optionalText(200, 'Use no máximo 200 caracteres.'),
    institutionName: optionalText(80, 'Use no máximo 80 caracteres.'),
    icon: z
      .union([
        z
          .string()
          .trim()
          .min(1)
          .max(40, 'Use no máximo 40 caracteres.')
          .regex(/^[a-z0-9-]+$/i, 'Use um identificador de ícone válido.'),
        z.literal(''),
      ])
      .nullish()
      .transform((value) => value || null),
    color: z
      .union([
        z
          .string()
          .trim()
          .regex(/^#[0-9a-f]{6}$/i, 'Use uma cor hexadecimal válida.'),
        z.literal(''),
      ])
      .nullish()
      .transform((value) => value || null),
    accountType: z.enum(ACCOUNT_TYPES, {
      message: 'Selecione um tipo de conta válido.',
    }),
    includeInBalance: z.boolean({
      message: 'Informe se a conta deve ser incluída no saldo.',
    }),
    includeInNetWorth: z.boolean({
      message: 'Informe se a conta deve ser incluída no patrimônio.',
    }),
    initialBalanceMinor: z
      .number({ message: 'Informe um saldo inicial válido.' })
      .int('O saldo inicial deve usar centavos inteiros.')
      .min(MIN_MONEY_MINOR, 'O saldo inicial está abaixo do limite permitido.')
      .max(MAX_MONEY_MINOR, 'O saldo inicial está acima do limite permitido.'),
    initialBalanceDate: z
      .string({ message: 'Informe a data do saldo inicial.' })
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Use uma data válida no formato AAAA-MM-DD.',
      )
      .refine((value) => {
        const parts = value.split('-').map(Number)
        const year = parts[0]!
        const month = parts[1]!
        const day = parts[2]!
        const date = new Date(Date.UTC(year, month - 1, day))
        return (
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day
        )
      }, 'Informe uma data válida.'),
  })
  .strict()

export const updateAccountSchema = createAccountSchema
  .extend({
    accountId: identifierSchema,
  })
  .strict()

export const accountActionSchema = z
  .object({ accountId: identifierSchema })
  .strict()
