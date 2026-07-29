import { describe, expect, it } from 'vitest'

import { createAuthRepositoryMock } from '../../../test/mocks/repositories/authRepositoryMock'
import { AuthService } from './AuthService'

describe('AuthService', () => {
  it('delega o logout ao repository e resolve sem retorno', async () => {
    const repository = createAuthRepositoryMock()
    repository.signOut.mockResolvedValue(undefined)
    const service = new AuthService(repository)

    await expect(service.signOut()).resolves.toBeUndefined()
    expect(repository.signOut.mock.calls).toHaveLength(1)
  })
})
