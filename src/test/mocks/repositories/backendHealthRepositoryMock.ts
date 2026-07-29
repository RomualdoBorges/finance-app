import { vi, type Mocked } from 'vitest'

import type {
  BackendHealth,
  BackendHealthRepository,
} from '../../../repositories/contracts/BackendHealthRepository'

const defaultHealth: BackendHealth = {
  available: true,
  initializedClients: ['app', 'authentication', 'firestore', 'storage'],
}

export function createBackendHealthRepositoryMock(
  health: BackendHealth = defaultHealth,
): Mocked<BackendHealthRepository> {
  return {
    getHealth: vi
      .fn<BackendHealthRepository['getHealth']>()
      .mockReturnValue(health),
  }
}
