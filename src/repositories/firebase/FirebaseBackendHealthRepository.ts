import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'

import type {
  BackendHealth,
  BackendHealthRepository,
} from '../contracts/BackendHealthRepository'

interface FirebaseBackendHealthRepositoryDependencies {
  readonly app: FirebaseApp
  readonly auth: Auth
  readonly firestore: Firestore
  readonly storage: FirebaseStorage
}

export class FirebaseBackendHealthRepository implements BackendHealthRepository {
  private readonly dependencies: FirebaseBackendHealthRepositoryDependencies

  constructor(dependencies: FirebaseBackendHealthRepositoryDependencies) {
    this.dependencies = dependencies
  }

  getHealth(): BackendHealth {
    const { app, auth, firestore, storage } = this.dependencies

    return {
      available: Boolean(app.name && auth.app && firestore.app && storage.app),
      initializedClients: ['app', 'authentication', 'firestore', 'storage'],
    }
  }
}
