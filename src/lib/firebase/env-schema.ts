import { z } from 'zod'

const publicVariablePrefix = 'VITE_'

const nonEmptyStringSchema = z.string().trim().min(1, 'não pode estar vazia')
const hostnameSchema = nonEmptyStringSchema.regex(
  /^(?:localhost|(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)$/,
  'deve ser um hostname sem protocolo, porta ou caminho',
)
const hostAndPortSchema = nonEmptyStringSchema.regex(
  /^(?:localhost|[a-zA-Z0-9.-]+):\d{1,5}$/,
  'deve conter hostname e porta, sem protocolo ou caminho',
)
const emulatorUrlSchema = z
  .string()
  .url('deve ser uma URL válida')
  .refine((value) => {
    const url = new URL(value)
    return (
      url.protocol === 'http:' &&
      url.username === '' &&
      url.password === '' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === ''
    )
  }, 'deve ser uma URL HTTP sem credenciais, caminho, query ou fragmento')

const portSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'deve ser uma porta numérica')
  .transform(Number)
  .pipe(
    z
      .number()
      .int()
      .min(1, 'deve estar entre 1 e 65535')
      .max(65_535, 'deve estar entre 1 e 65535'),
  )

const firebaseEnvSchema = z
  .object({
    VITE_FIREBASE_API_KEY: nonEmptyStringSchema,
    VITE_FIREBASE_AUTH_DOMAIN: hostnameSchema,
    VITE_FIREBASE_PROJECT_ID: nonEmptyStringSchema.regex(
      /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
      'deve ser um ID de projeto Firebase válido',
    ),
    VITE_FIREBASE_STORAGE_BUCKET: hostnameSchema,
    VITE_FIREBASE_MESSAGING_SENDER_ID: nonEmptyStringSchema.regex(
      /^\d+$/,
      'deve conter somente dígitos',
    ),
    VITE_FIREBASE_APP_ID: nonEmptyStringSchema.regex(
      /^\d+:\d+:web:[a-fA-F0-9]+$/,
      'deve ser um App ID Web Firebase válido',
    ),
    VITE_FIREBASE_USE_EMULATORS: z
      .enum(['true', 'false'])
      .optional()
      .default('false')
      .transform((value) => value === 'true'),
    VITE_FIREBASE_AUTH_EMULATOR_HOST: hostnameSchema.optional(),
    VITE_FIREBASE_AUTH_EMULATOR_PORT: portSchema.optional(),
    VITE_FIREBASE_AUTH_EMULATOR_URL: emulatorUrlSchema.optional(),
    VITE_FIRESTORE_EMULATOR_HOST: hostAndPortSchema.optional(),
    VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: hostnameSchema.optional(),
    VITE_FIREBASE_FIRESTORE_EMULATOR_PORT: portSchema.optional(),
    VITE_FIREBASE_STORAGE_EMULATOR_HOST: hostnameSchema.optional(),
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

const firebasePublicVariableNames = new Set(
  Object.keys(firebaseEnvSchema.shape),
)

export type FirebasePublicEnvironment = z.output<typeof firebaseEnvSchema>
export type FirebaseEnvironmentInput = Readonly<Record<string, unknown>>

export class FirebaseEnvironmentError extends Error {
  constructor(message: string) {
    super(`Configuração pública do Firebase inválida: ${message}`)
    this.name = 'FirebaseEnvironmentError'
  }
}

function findUnknownPublicVariables(environment: FirebaseEnvironmentInput) {
  return Object.keys(environment)
    .filter(
      (variable) =>
        variable.startsWith(publicVariablePrefix) &&
        !firebasePublicVariableNames.has(variable),
    )
    .sort()
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const variable = issue.path[0] ?? 'ambiente'
      return `${String(variable)}: ${issue.message}`
    })
    .join('; ')
}

export function parseFirebaseEnvironment(
  environment: FirebaseEnvironmentInput,
): FirebasePublicEnvironment {
  const unknownVariables = findUnknownPublicVariables(environment)

  if (unknownVariables.length > 0) {
    throw new FirebaseEnvironmentError(
      `variáveis públicas desconhecidas: ${unknownVariables.join(', ')}`,
    )
  }

  const result = firebaseEnvSchema.safeParse(environment)

  if (!result.success) {
    throw new FirebaseEnvironmentError(formatIssues(result.error))
  }

  return result.data
}
