import type { FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'

interface EmulatorConfiguration {
  readonly enabled: boolean
  readonly authUrl: string | undefined
  readonly firestoreUrl: string | undefined
  readonly storageUrl: string | undefined
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

const firebaseEmulatorGlobalState = globalThis as typeof globalThis &
  FirebaseEmulatorGlobalState

const connectedApps =
  firebaseEmulatorGlobalState.__financeAppConnectedFirebaseEmulators ??
  new WeakSet<FirebaseApp>()

firebaseEmulatorGlobalState.__financeAppConnectedFirebaseEmulators =
  connectedApps

function getHostAndPort(url: string) {
  const parsedUrl = new URL(url)
  const port = Number(parsedUrl.port)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`URL de emulador sem porta válida: ${parsedUrl.origin}`)
  }

  return { host: parsedUrl.hostname, port }
}

export function connectFirebaseEmulators({
  app,
  auth,
  firestore,
  storage,
  configuration,
}: FirebaseEmulatorClients): void {
  if (!configuration.enabled || connectedApps.has(app)) {
    return
  }

  if (
    !configuration.authUrl ||
    !configuration.firestoreUrl ||
    !configuration.storageUrl
  ) {
    throw new Error('URLs dos emuladores Firebase não foram configuradas')
  }

  const firestoreAddress = getHostAndPort(configuration.firestoreUrl)
  const storageAddress = getHostAndPort(configuration.storageUrl)

  connectAuthEmulator(auth, configuration.authUrl, {
    disableWarnings: true,
  })
  connectFirestoreEmulator(
    firestore,
    firestoreAddress.host,
    firestoreAddress.port,
  )
  connectStorageEmulator(storage, storageAddress.host, storageAddress.port)
  connectedApps.add(app)
}
