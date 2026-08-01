import { z } from 'zod'

export const themeSchema = z.enum(['light', 'dark', 'system'])

export type Theme = z.infer<typeof themeSchema>

export const interfacePreferencesSchema = z
  .object({
    theme: themeSchema,
  })
  .strict()
