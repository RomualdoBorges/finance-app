import { describe, expect, it } from 'vitest'

import { parseFirebaseEnvironment } from './env-schema'

const baseEnvironment = {
  VITE_FIREBASE_API_KEY: 'fake-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'fake-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'fake-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'fake-project.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  VITE_FIREBASE_APP_ID: '1:000000000000:web:0000000000000000000000',
}

const emulatorEnvironment = {
  VITE_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1',
  VITE_FIREBASE_AUTH_EMULATOR_PORT: '9099',
  VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
  VITE_FIREBASE_FIRESTORE_EMULATOR_PORT: '8080',
  VITE_FIREBASE_STORAGE_EMULATOR_HOST: '127.0.0.1',
  VITE_FIREBASE_STORAGE_EMULATOR_PORT: '9199',
}

describe('parseFirebaseEnvironment', () => {
  it('aplica false como padrão e remove chaves internas do Vite', () => {
    const result = parseFirebaseEnvironment({
      ...baseEnvironment,
      MODE: 'test',
      DEV: true,
    })

    expect(result.VITE_FIREBASE_USE_EMULATORS).toBe(false)
    expect(result).not.toHaveProperty('MODE')
  })

  it('aceita emuladores desativados sem endereços', () => {
    const result = parseFirebaseEnvironment({
      ...baseEnvironment,
      VITE_FIREBASE_USE_EMULATORS: 'false',
    })

    expect(result.VITE_FIREBASE_USE_EMULATORS).toBe(false)
  })

  it('converte a flag true e as portas de uma configuração válida', () => {
    const result = parseFirebaseEnvironment({
      ...baseEnvironment,
      ...emulatorEnvironment,
      VITE_FIREBASE_USE_EMULATORS: 'true',
    })

    expect(result.VITE_FIREBASE_USE_EMULATORS).toBe(true)
    expect(result.VITE_FIREBASE_AUTH_EMULATOR_PORT).toBe(9099)
    expect(result.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1')
  })

  it('rejeita variável pública desconhecida sem exibir seu valor', () => {
    const secretValue = 'valor-que-nao-pode-aparecer'

    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        VITE_FIREBASE_UNKNOWN: secretValue,
      }),
    ).toThrowError(/variáveis públicas desconhecidas: VITE_FIREBASE_UNKNOWN/)

    try {
      parseFirebaseEnvironment({
        ...baseEnvironment,
        VITE_FIREBASE_UNKNOWN: secretValue,
      })
    } catch (error) {
      expect(String(error)).not.toContain(secretValue)
    }
  })

  it('aceita variáveis auxiliares conhecidas do Emulator Suite', () => {
    const result = parseFirebaseEnvironment({
      ...baseEnvironment,
      VITE_FIREBASE_AUTH_EMULATOR_URL: 'http://127.0.0.1:9099',
      VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    })

    expect(result.VITE_FIREBASE_AUTH_EMULATOR_URL).toBe('http://127.0.0.1:9099')
    expect(result.VITE_FIRESTORE_EMULATOR_HOST).toBe('127.0.0.1:8080')
  })

  it('rejeita variável obrigatória ausente com mensagem clara', () => {
    const incompleteEnvironment: Record<string, string> = {
      ...baseEnvironment,
    }
    delete incompleteEnvironment['VITE_FIREBASE_PROJECT_ID']

    expect(() => parseFirebaseEnvironment(incompleteEnvironment)).toThrowError(
      /VITE_FIREBASE_PROJECT_ID/,
    )
  })

  it('rejeita flag de emuladores diferente de true ou false', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        VITE_FIREBASE_USE_EMULATORS: '1',
      }),
    ).toThrowError(/VITE_FIREBASE_USE_EMULATORS/)
  })

  it('exige todos os endereços quando os emuladores estão habilitados', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        VITE_FIREBASE_USE_EMULATORS: 'true',
      }),
    ).toThrowError(/VITE_FIREBASE_AUTH_EMULATOR_HOST/)
  })

  it('rejeita uma porta não numérica', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        ...emulatorEnvironment,
        VITE_FIREBASE_AUTH_EMULATOR_PORT: 'porta',
      }),
    ).toThrow()
  })

  it('rejeita uma porta fora do intervalo', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        ...emulatorEnvironment,
        VITE_FIREBASE_STORAGE_EMULATOR_PORT: '65536',
      }),
    ).toThrow()
  })

  it('rejeita um host vazio', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        ...emulatorEnvironment,
        VITE_FIREBASE_USE_EMULATORS: 'true',
        VITE_FIREBASE_FIRESTORE_EMULATOR_HOST: ' ',
      }),
    ).toThrow()
  })

  it('rejeita host com protocolo ou caminho', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        ...emulatorEnvironment,
        VITE_FIREBASE_USE_EMULATORS: 'true',
        VITE_FIREBASE_AUTH_EMULATOR_HOST: 'http://127.0.0.1/auth',
      }),
    ).toThrowError(/VITE_FIREBASE_AUTH_EMULATOR_HOST/)
  })

  it('rejeita formatos inválidos dos identificadores públicos', () => {
    expect(() =>
      parseFirebaseEnvironment({
        ...baseEnvironment,
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'sender-id',
        VITE_FIREBASE_APP_ID: 'app-id',
      }),
    ).toThrowError(/VITE_FIREBASE_MESSAGING_SENDER_ID/)
  })
})
