import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

import { connectFirebaseEmulators } from './emulators'
import { firebaseEnvironment } from './env'

const app =
  getApps().length === 0 ? initializeApp(firebaseEnvironment.config) : getApp()

const auth = getAuth(app)
const firestore = getFirestore(app)
const storage = getStorage(app)

connectFirebaseEmulators({
  app,
  auth,
  firestore,
  storage,
  configuration: firebaseEnvironment.emulators,
})

export const firebaseClients = {
  app,
  auth,
  firestore,
  storage,
} as const
