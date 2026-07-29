import type { FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'

interface EmulatorConfiguration {
  readonly enabled: boolean
  readonly authHost: string | undefined
  readonly authPort: number | undefined
  readonly firestoreHost: string | undefined
  readonly firestorePort: number | undefined
  readonly storageHost: string | undefined
  readonly storagePort: number | undefined
}

interface FirebaseEmulatorClients {
  readonly app: FirebaseApp
  readonly auth: Auth
  readonly firestore: Firestore
  readonly storage: FirebaseStorage
  readonly configuration: EmulatorConfiguration
}

interface FirebaseEmulatorGlobalState {
  __financeAppConnectedFirebaseEmulators?: WeakSet<FirebaseApp>
}

const globalState = globalThis as typeof globalThis &
  FirebaseEmulatorGlobalState
const connectedApps =
  globalState.__financeAppConnectedFirebaseEmulators ??
  new WeakSet<FirebaseApp>()

globalState.__financeAppConnectedFirebaseEmulators = connectedApps

export function connectFirebaseEmulators({
  app,
  auth,
  firestore,
  storage,
  configuration,
}: FirebaseEmulatorClients): void {
  if (!configuration.enabled || connectedApps.has(app)) return

  const {
    authHost,
    authPort,
    firestoreHost,
    firestorePort,
    storageHost,
    storagePort,
  } = configuration

  if (
    authHost === undefined ||
    authPort === undefined ||
    firestoreHost === undefined ||
    firestorePort === undefined ||
    storageHost === undefined ||
    storagePort === undefined
  ) {
    throw new Error(
      'Hosts e portas dos emuladores Firebase não foram configurados',
    )
  }

  connectAuthEmulator(auth, `http://${authHost}:${authPort}`, {
    disableWarnings: true,
  })
  connectFirestoreEmulator(firestore, firestoreHost, firestorePort)
  connectStorageEmulator(storage, storageHost, storagePort)
  connectedApps.add(app)
}
