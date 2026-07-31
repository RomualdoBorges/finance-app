import { z } from 'zod'

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
