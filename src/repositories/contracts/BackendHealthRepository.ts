export interface BackendHealth {
  readonly available: boolean
  readonly initializedClients: readonly [
    'app',
    'authentication',
    'firestore',
    'storage',
  ]
}

export interface BackendHealthRepository {
  getHealth(): BackendHealth
}
