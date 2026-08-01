import { z } from 'zod'

import { CATEGORY_TYPES } from './Category'

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) => !value.includes('/'))

export const categoryIdentitySchema = z.object({
  groupId: identifierSchema,
  userId: identifierSchema,
})

export const createCustomCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe um nome com pelo menos 2 caracteres.')
    .max(60, 'Use no máximo 60 caracteres.')
    .refine(
      (value) => /[\p{L}\p{N}]/u.test(value),
      'O nome deve conter ao menos uma letra ou número.',
    ),
  type: z.enum(CATEGORY_TYPES),
  parentCategoryId: identifierSchema
    .nullish()
    .transform((value) => value ?? null),
  icon: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z0-9-]+$/i)
    .nullish()
    .transform((value) => value ?? null),
})

export const updateCategorySchema = createCustomCategorySchema.extend({
  categoryId: identifierSchema,
})

export const categoryActionSchema = z.object({
  categoryId: identifierSchema,
})
