import type { Firestore } from 'firebase/firestore'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../../auth/domain/AuthenticatedUser'
import { UserProfileError } from '../domain/UserProfileError'
import {
  FirestoreUserRepository,
  mapUserProfileSnapshot,
} from './FirestoreUserRepository'

const user: AuthenticatedUser = {
  uid: 'user-1',
  email: 'pessoa@example.com',
  displayName: null,
  photoURL: null,
  emailVerified: true,
}
const createdAt = new Date('2026-01-01T00:00:00Z')
const updatedAt = new Date('2026-01-02T00:00:00Z')
const timestamp = (date: Date) => ({ toDate: () => date })
const profileData = {
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  createdAt: timestamp(createdAt),
  updatedAt: timestamp(updatedAt),
  futureField: 'não deve vazar',
}
const existingSnapshot = {
  id: user.uid,
  exists: true,
  data: profileData,
}

function createRepository() {
  const reference = { path: 'users/user-1' }
  const serverTimestampValue = { serverTimestamp: true }
  const operations = {
    profileReference: vi.fn().mockReturnValue(reference),
    getProfile: vi.fn().mockResolvedValue(existingSnapshot),
    mergeProfile: vi.fn().mockResolvedValue(undefined),
    serverTimestamp: vi.fn().mockReturnValue(serverTimestampValue),
  }

  return {
    repository: new FirestoreUserRepository({} as Firestore, operations),
    operations,
    reference,
    serverTimestampValue,
  }
}

describe('mapUserProfileSnapshot', () => {
  it('converte timestamps, usa o ID do documento e não expõe extras', () => {
    expect(mapUserProfileSnapshot(existingSnapshot)).toEqual({
      id: 'user-1',
      email: 'pessoa@example.com',
      displayName: null,
      photoURL: null,
      createdAt,
      updatedAt,
    })
  })

  it('retorna null para documento inexistente', () => {
    expect(
      mapUserProfileSnapshot({
        id: 'user-1',
        exists: false,
        data: undefined,
      }),
    ).toBeNull()
  })

  it('sanitiza documento inválido', () => {
    expect(() =>
      mapUserProfileSnapshot({
        id: 'user-1',
        exists: true,
        data: { ...profileData, createdAt: 'data local' },
      }),
    ).toThrowError(UserProfileError)
  })
})

describe('FirestoreUserRepository', () => {
  it('busca exclusivamente users/{uid}', async () => {
    const { repository, operations, reference } = createRepository()

    await expect(repository.getUserProfile('user-1')).resolves.toMatchObject({
      id: 'user-1',
    })
    expect(operations.profileReference).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
    )
    expect(operations.getProfile).toHaveBeenCalledWith(reference)
  })

  it('cria documento inexistente com timestamps do servidor e relê valores materializados', async () => {
    const { repository, operations, reference, serverTimestampValue } =
      createRepository()
    operations.getProfile
      .mockResolvedValueOnce({
        id: 'user-1',
        exists: false,
        data: undefined,
      })
      .mockResolvedValueOnce(existingSnapshot)

    await expect(repository.ensureUserProfile(user)).resolves.toMatchObject({
      id: 'user-1',
      createdAt,
    })
    expect(operations.mergeProfile).toHaveBeenCalledWith(reference, {
      email: user.email,
      displayName: null,
      photoURL: null,
      createdAt: serverTimestampValue,
      updatedAt: serverTimestampValue,
    })
    expect(operations.getProfile).toHaveBeenCalledTimes(2)
  })

  it('não escreve quando o documento já está sincronizado', async () => {
    const { repository, operations } = createRepository()

    await repository.ensureUserProfile(user)
    await repository.ensureUserProfile(user)

    expect(operations.mergeProfile).not.toHaveBeenCalled()
    expect(operations.serverTimestamp).not.toHaveBeenCalled()
  })

  it.each([
    ['email', 'novo@example.com'],
    ['displayName', 'Pessoa'],
    ['photoURL', 'https://example.com/photo.jpg'],
  ] as const)(
    'atualiza somente %s e updatedAt, preservando createdAt e extras',
    async (field, value) => {
      const { repository, operations, reference, serverTimestampValue } =
        createRepository()
      operations.getProfile
        .mockResolvedValueOnce(existingSnapshot)
        .mockResolvedValueOnce({
          ...existingSnapshot,
          data: {
            ...profileData,
            [field]: value,
            updatedAt: timestamp(new Date('2026-01-03T00:00:00Z')),
          },
        })

      await repository.ensureUserProfile({ ...user, [field]: value })

      expect(operations.mergeProfile).toHaveBeenCalledWith(reference, {
        [field]: value,
        updatedAt: serverTimestampValue,
      })
    },
  )

  it.each([
    ['permission-denied', 'permission-denied'],
    ['unavailable', 'unavailable'],
    ['internal', 'unknown'],
  ])('sanitiza erro %s', async (firebaseCode, domainCode) => {
    const { repository, operations } = createRepository()
    operations.getProfile.mockRejectedValue({
      code: firebaseCode,
      message: 'projects/internal/databases/path',
    })

    await expect(repository.getUserProfile('user-1')).rejects.toMatchObject({
      code: domainCode,
    })
    await expect(repository.getUserProfile('user-1')).rejects.not.toThrow(
      'projects/internal',
    )
  })

  it('rejeita UID inválido sem acessar Firestore', async () => {
    const { repository, operations } = createRepository()

    await expect(repository.getUserProfile('')).rejects.toMatchObject({
      code: 'unauthenticated',
    })
    expect(operations.profileReference).not.toHaveBeenCalled()
  })
})
