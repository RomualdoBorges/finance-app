import { describe, expect, it } from 'vitest'

import { createBackendHealthRepositoryMock } from '../test/mocks/repositories/backendHealthRepositoryMock'
import { BackendHealthService } from './BackendHealthService'

describe('BackendHealthService', () => {
  it('retorna a saúde informada pelo repository', () => {
    const health = {
      available: false,
      initializedClients: ['app', 'authentication', 'firestore', 'storage'],
    } as const
    const repository = createBackendHealthRepositoryMock(health)
    const service = new BackendHealthService(repository)

    expect(service.getHealth()).toEqual(health)
    expect(repository.getHealth.mock.calls).toHaveLength(1)
  })
})
