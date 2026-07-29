import { parseFirebaseEnvironment } from './env-schema'

const parsedEnv = parseFirebaseEnvironment(import.meta.env)

export const firebaseEnvironment = {
  config: {
    apiKey: parsedEnv.VITE_FIREBASE_API_KEY,
    authDomain: parsedEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: parsedEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: parsedEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: parsedEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: parsedEnv.VITE_FIREBASE_APP_ID,
  },
  emulators: {
    enabled: parsedEnv.VITE_FIREBASE_USE_EMULATORS,
    authHost: parsedEnv.VITE_FIREBASE_AUTH_EMULATOR_HOST,
    authPort: parsedEnv.VITE_FIREBASE_AUTH_EMULATOR_PORT,
    firestoreHost: parsedEnv.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST,
    firestorePort: parsedEnv.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT,
    storageHost: parsedEnv.VITE_FIREBASE_STORAGE_EMULATOR_HOST,
    storagePort: parsedEnv.VITE_FIREBASE_STORAGE_EMULATOR_PORT,
  },
} as const
