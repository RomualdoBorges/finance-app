import { describe, expect, it } from 'vitest'

import { createAuthRepositoryMock } from '../../../test/mocks/repositories/authRepositoryMock'
import { AuthService } from './AuthService'

describe('AuthService', () => {
  it('cadastra sem solicitar o envio da verificação', async () => {
    const repository = createAuthRepositoryMock()
    repository.registerWithEmailAndPassword.mockResolvedValue({
      uid: 'user-1',
      email: 'pessoa@example.com',
      displayName: null,
      photoURL: null,
      emailVerified: false,
    })
    const service = new AuthService(repository)

    await service.registerWithEmailAndPassword('pessoa@example.com', 'segredo')

    expect(repository.registerWithEmailAndPassword.mock.calls).toEqual([
      ['pessoa@example.com', 'segredo'],
    ])
    expect(repository.sendVerificationEmail.mock.calls).toHaveLength(0)
  })

  it('delega o logout ao repository e resolve sem retorno', async () => {
    const repository = createAuthRepositoryMock()
    repository.signOut.mockResolvedValue(undefined)
    const service = new AuthService(repository)

    await expect(service.signOut()).resolves.toBeUndefined()
    expect(repository.signOut.mock.calls).toHaveLength(1)
  })

  it('delega a recuperação de senha ao repository', async () => {
    const repository = createAuthRepositoryMock()
    repository.sendPasswordResetEmail.mockResolvedValue(undefined)
    const service = new AuthService(repository)

    await expect(
      service.sendPasswordResetEmail('pessoa@example.com'),
    ).resolves.toBeUndefined()
    expect(repository.sendPasswordResetEmail.mock.calls).toEqual([
      ['pessoa@example.com'],
    ])
  })

  it('delega envio e atualização da verificação ao repository', async () => {
    const repository = createAuthRepositoryMock()
    repository.sendVerificationEmail.mockResolvedValue(undefined)
    repository.reloadAuthenticatedUser.mockResolvedValue({
      uid: 'user-1',
      email: 'pessoa@example.com',
      displayName: null,
      photoURL: null,
      emailVerified: true,
    })
    const service = new AuthService(repository)

    await expect(service.sendVerificationEmail()).resolves.toBeUndefined()
    await expect(service.reloadAuthenticatedUser()).resolves.toMatchObject({
      emailVerified: true,
    })
    expect(repository.sendVerificationEmail.mock.calls).toHaveLength(1)
    expect(repository.reloadAuthenticatedUser.mock.calls).toHaveLength(1)
  })

  it('delega a atualização de senha ao repository', async () => {
    const repository = createAuthRepositoryMock()
    repository.updatePassword.mockResolvedValue(undefined)
    const service = new AuthService(repository)
    const input = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova',
    }

    await expect(service.updatePassword(input)).resolves.toBeUndefined()
    expect(repository.updatePassword.mock.calls).toEqual([[input]])
  })

  it('delega a exclusão da conta ao repository', async () => {
    const repository = createAuthRepositoryMock()
    repository.deleteCurrentUser.mockResolvedValue(undefined)
    const service = new AuthService(repository)
    const input = { currentPassword: 'senha-atual' }

    await expect(service.deleteCurrentUser(input)).resolves.toBeUndefined()
    expect(repository.deleteCurrentUser.mock.calls).toEqual([[input]])
  })
})
