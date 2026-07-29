import type { Auth, User, UserCredential } from 'firebase/auth'
import { describe, expect, it, vi } from 'vitest'

import { AuthError } from '../domain/AuthError'
import {
  FirebaseAuthRepository,
  mapFirebaseAuthError,
  mapFirebaseUser,
} from './FirebaseAuthRepository'

const firebaseUser = {
  uid: 'user-1',
  email: 'pessoa@example.com',
  displayName: 'Pessoa',
  photoURL: null,
  emailVerified: false,
} as User

const credential = { user: firebaseUser } as UserCredential

function createRepository() {
  const unsubscribe = vi.fn()
  const operations = {
    createUser: vi.fn().mockResolvedValue(credential),
    signIn: vi.fn().mockResolvedValue(credential),
    signOut: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(unsubscribe),
  }

  return {
    repository: new FirebaseAuthRepository({} as Auth, operations),
    operations,
    unsubscribe,
  }
}

describe('FirebaseAuthRepository', () => {
  it('mapeia somente os campos seguros do Firebase User', () => {
    expect(mapFirebaseUser(firebaseUser)).toEqual({
      uid: 'user-1',
      email: 'pessoa@example.com',
      displayName: 'Pessoa',
      photoURL: null,
      emailVerified: false,
    })
    expect(mapFirebaseUser(firebaseUser)).not.toHaveProperty('refreshToken')
  })

  it('mapeia e-mail já cadastrado', () => {
    expect(
      mapFirebaseAuthError({ code: 'auth/email-already-in-use' }),
    ).toMatchObject<AuthError>({
      code: 'email-already-in-use',
      message: 'Este e-mail já está cadastrado.',
      name: 'AuthError',
    })
  })

  it('usa mensagem genérica para credenciais inválidas', () => {
    expect(mapFirebaseAuthError({ code: 'auth/user-not-found' }).message).toBe(
      'E-mail ou senha inválidos.',
    )
  })

  it('sanitiza erros desconhecidos', () => {
    const error = mapFirebaseAuthError({
      code: 'auth/internal-error',
      message: 'token secreto e stack interna',
    })

    expect(error.code).toBe('unknown')
    expect(error.message).not.toContain('token secreto')
    expect(error.message).not.toContain('auth/internal-error')
  })

  it('chama o cadastro e retorna o modelo interno', async () => {
    const { repository, operations } = createRepository()

    await expect(
      repository.registerWithEmailAndPassword('pessoa@example.com', 'segredo'),
    ).resolves.toEqual(mapFirebaseUser(firebaseUser))
    expect(operations.createUser).toHaveBeenCalledWith(
      expect.anything(),
      'pessoa@example.com',
      'segredo',
    )
  })

  it('chama o login e retorna o modelo interno', async () => {
    const { repository, operations } = createRepository()

    await repository.signInWithEmailAndPassword('pessoa@example.com', 'segredo')

    expect(operations.signIn).toHaveBeenCalledWith(
      expect.anything(),
      'pessoa@example.com',
      'segredo',
    )
  })

  it('preserva o unsubscribe retornado pela sessão', () => {
    const { repository, unsubscribe } = createRepository()
    const returnedUnsubscribe = repository.subscribeToAuthState(vi.fn())

    expect(returnedUnsubscribe).toBe(unsubscribe)
  })

  it('encerra a sessão usando a instância Auth configurada', async () => {
    const { repository, operations } = createRepository()

    await expect(repository.signOut()).resolves.toBeUndefined()
    expect(operations.signOut).toHaveBeenCalledOnce()
    expect(operations.signOut).toHaveBeenCalledWith(expect.anything())
  })

  it('solicita a recuperação usando a instância Auth configurada', async () => {
    const { repository, operations } = createRepository()

    await expect(
      repository.sendPasswordResetEmail('pessoa@example.com'),
    ).resolves.toBeUndefined()
    expect(operations.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      'pessoa@example.com',
    )
  })

  it('não revela quando o usuário não existe', async () => {
    const { repository, operations } = createRepository()
    operations.sendPasswordResetEmail.mockRejectedValueOnce({
      code: 'auth/user-not-found',
    })

    await expect(
      repository.sendPasswordResetEmail('ausente@example.com'),
    ).resolves.toBeUndefined()
  })

  it.each([
    ['auth/invalid-email', 'invalid-email'],
    ['auth/too-many-requests', 'too-many-requests'],
    ['auth/network-request-failed', 'network-unavailable'],
    ['auth/internal-error', 'password-reset-failed'],
  ])('sanitiza a falha de recuperação %s', async (firebaseCode, domainCode) => {
    const { repository, operations } = createRepository()
    operations.sendPasswordResetEmail.mockRejectedValueOnce({
      code: firebaseCode,
      message: 'detalhes internos',
    })

    await expect(
      repository.sendPasswordResetEmail('pessoa@example.com'),
    ).rejects.toMatchObject({ code: domainCode })
  })

  it('sanitiza falhas ao encerrar a sessão', async () => {
    const { repository, operations } = createRepository()
    operations.signOut.mockRejectedValueOnce({
      code: 'auth/internal-error',
      message: 'token secreto',
    })

    await expect(repository.signOut()).rejects.toMatchObject({
      code: 'sign-out-failed',
      message: 'Não foi possível sair da conta. Tente novamente.',
    })
  })
})
