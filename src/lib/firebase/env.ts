import { z } from 'zod'

const emulatorUrlSchema = z
  .url('deve ser uma URL válida')
  .refine((url) => url.startsWith('http://'), {
    message: 'deve usar http:// para um emulador local',
  })

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
    VITE_FIREBASE_AUTH_EMULATOR_URL: emulatorUrlSchema.optional(),
    VITE_FIRESTORE_EMULATOR_URL: emulatorUrlSchema.optional(),
    VITE_FIREBASE_STORAGE_EMULATOR_URL: emulatorUrlSchema.optional(),
  })
  .superRefine((env, context) => {
    if (!env.VITE_FIREBASE_USE_EMULATORS) {
      return
    }

    const requiredEmulatorVariables = [
      'VITE_FIREBASE_AUTH_EMULATOR_URL',
      'VITE_FIRESTORE_EMULATOR_URL',
      'VITE_FIREBASE_STORAGE_EMULATOR_URL',
    ] as const

    for (const variable of requiredEmulatorVariables) {
      if (!env[variable]) {
        context.addIssue({
          code: 'custom',
          message: 'é obrigatória quando os emuladores estão habilitados',
          path: [variable],
        })
      }
    }
  })

const parsedEnv = firebaseEnvSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'ambiente'}: ${issue.message}`)
    .join('; ')

  throw new Error(`Configuração pública do Firebase inválida: ${details}`)
}

export const firebaseEnvironment = {
  config: {
    apiKey: parsedEnv.data.VITE_FIREBASE_API_KEY,
    authDomain: parsedEnv.data.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: parsedEnv.data.VITE_FIREBASE_PROJECT_ID,
    storageBucket: parsedEnv.data.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsedEnv.data.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: parsedEnv.data.VITE_FIREBASE_APP_ID,
  },
  emulators: {
    enabled: import.meta.env.DEV && parsedEnv.data.VITE_FIREBASE_USE_EMULATORS,
    authUrl: parsedEnv.data.VITE_FIREBASE_AUTH_EMULATOR_URL,
    firestoreUrl: parsedEnv.data.VITE_FIRESTORE_EMULATOR_URL,
    storageUrl: parsedEnv.data.VITE_FIREBASE_STORAGE_EMULATOR_URL,
  },
} as const
