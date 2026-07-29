import { z } from 'zod'

const portSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'deve ser uma porta numérica')
  .transform(Number)
  .pipe(z.number().int().min(1).max(65_535))

const firebaseEnvSchema = z
  .object({
    VITE_FIREBASE_API_KEY: z.string().trim().min(1),
    VITE_FIREBASE_AUTH_DOMAIN: z.string().trim().min(1),
    VITE_FIREBASE_PROJECT_ID: z.string().trim().min(1),
    VITE_FIREBASE_STORAGE_BUCKET: z.string().trim().min(1),
    VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().trim().min(1),
    VITE_FIREBASE_APP_ID: z.string().trim().min(1),
    VITE_FIREBASE_USE_EMULATORS: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((value) => value === 'true'),
    VITE_FIREBASE_AUTH_EMULATOR_HOST: z.string().trim().min(1).optional(),
    VITE_FIREBASE_AUTH_EMULATOR_PORT: portSchema.optional(),
    VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: z.string().trim().min(1).optional(),
    VITE_FIREBASE_FIRESTORE_EMULATOR_PORT: portSchema.optional(),
    VITE_FIREBASE_STORAGE_EMULATOR_HOST: z.string().trim().min(1).optional(),
    VITE_FIREBASE_STORAGE_EMULATOR_PORT: portSchema.optional(),
  })
  .superRefine((env, context) => {
    if (!env.VITE_FIREBASE_USE_EMULATORS) return

    const requiredVariables = [
      'VITE_FIREBASE_AUTH_EMULATOR_HOST',
      'VITE_FIREBASE_AUTH_EMULATOR_PORT',
      'VITE_FIREBASE_FIRESTORE_EMULATOR_HOST',
      'VITE_FIREBASE_FIRESTORE_EMULATOR_PORT',
      'VITE_FIREBASE_STORAGE_EMULATOR_HOST',
      'VITE_FIREBASE_STORAGE_EMULATOR_PORT',
    ] as const

    for (const variable of requiredVariables) {
      if (env[variable] === undefined) {
        context.addIssue({
          code: 'custom',
          message: 'é obrigatória quando os emuladores estão habilitados',
          path: [variable],
        })
      }
    }
  })

export type FirebasePublicEnvironment = Record<string, string | undefined>

export function parseFirebaseEnvironment(
  environment: FirebasePublicEnvironment,
) {
  return firebaseEnvSchema.parse(environment)
}
