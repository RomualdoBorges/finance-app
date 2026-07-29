import { describe, expect, it } from 'vitest'

import { parseFirebaseEnvironment } from './env-schema'

const baseEnvironment = {
  VITE_FIREBASE_API_KEY: 'fake-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'fake-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'fake-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'fake-project.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  VITE_FIREBASE_APP_ID: 'fake-app-id',
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
})
