import type { Auth, AuthCredential, User, UserCredential } from 'firebase/auth'
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
const emailCredential = { providerId: 'password' } as AuthCredential
const reauthenticationErrorCases: ReadonlyArray<
  readonly [string, string, string]
> = [
  [
    'auth/invalid-credential',
    'current-credential-invalid',
    'Não foi possível confirmar sua senha atual.',
  ],
  [
    'auth/requires-recent-login',
    'recent-login-required',
    'Sua sessão precisa ser confirmada novamente. Informe sua senha atual e tente outra vez.',
  ],
  [
    'auth/too-many-requests',
    'too-many-requests',
    'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.',
  ],
  [
    'auth/network-request-failed',
    'password-update-network-unavailable',
    'Não foi possível atualizar a senha. Verifique sua conexão e tente novamente.',
  ],
  [
    'auth/internal-error',
    'password-update-failed',
    'Não foi possível atualizar a senha. Tente novamente.',
  ],
]

function createRepository() {
  const unsubscribe = vi.fn()
  const operations = {
    createUser: vi.fn().mockResolvedValue(credential),
    signIn: vi.fn().mockResolvedValue(credential),
    signOut: vi.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
    sendEmailVerification: vi.fn().mockResolvedValue(undefined),
    reload: vi.fn().mockResolvedValue(undefined),
    createEmailCredential: vi.fn().mockReturnValue(emailCredential),
    reauthenticate: vi.fn().mockResolvedValue(credential),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue(unsubscribe),
  }

  return {
    repository: new FirebaseAuthRepository(
      { currentUser: firebaseUser } as Auth,
      operations,
    ),
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
    expect(operations.sendEmailVerification.mock.calls).toHaveLength(0)
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

  it('reenvia a verificação para o usuário autenticado', async () => {
    const { repository, operations } = createRepository()

    await expect(repository.sendVerificationEmail()).resolves.toBeUndefined()
    expect(operations.sendEmailVerification).toHaveBeenCalledWith(firebaseUser)
  })

  it('recarrega e mapeia o usuário autenticado', async () => {
    const { repository, operations } = createRepository()

    await expect(repository.reloadAuthenticatedUser()).resolves.toEqual(
      mapFirebaseUser(firebaseUser),
    )
    expect(operations.reload).toHaveBeenCalledWith(firebaseUser)
  })

  it('não executa verificação sem uma sessão autenticada', async () => {
    const { operations } = createRepository()
    const repository = new FirebaseAuthRepository(
      { currentUser: null } as Auth,
      operations,
    )

    await expect(repository.sendVerificationEmail()).rejects.toMatchObject({
      code: 'user-not-authenticated',
    })
    await expect(repository.reloadAuthenticatedUser()).rejects.toMatchObject({
      code: 'user-not-authenticated',
    })
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

  it('cria a credencial, reautentica e somente depois atualiza a senha', async () => {
    const { repository, operations } = createRepository()

    await expect(
      repository.updatePassword({
        currentPassword: 'senha-atual',
        newPassword: 'senha-nova',
      }),
    ).resolves.toBeUndefined()

    expect(operations.createEmailCredential).toHaveBeenCalledWith(
      'pessoa@example.com',
      'senha-atual',
    )
    expect(operations.reauthenticate).toHaveBeenCalledWith(
      firebaseUser,
      emailCredential,
    )
    expect(operations.updatePassword).toHaveBeenCalledWith(
      firebaseUser,
      'senha-nova',
    )
    expect(operations.reauthenticate.mock.invocationCallOrder[0]).toBeLessThan(
      operations.updatePassword.mock.invocationCallOrder[0] ?? 0,
    )
  })

  it('não atualiza a senha quando a reautenticação falha', async () => {
    const { repository, operations } = createRepository()
    operations.reauthenticate.mockRejectedValueOnce({
      code: 'auth/wrong-password',
      message: 'detalhes internos',
    })

    await expect(
      repository.updatePassword({
        currentPassword: 'incorreta',
        newPassword: 'senha-nova',
      }),
    ).rejects.toMatchObject({
      code: 'incorrect-current-password',
      message: 'A senha atual está incorreta.',
    })
    expect(operations.updatePassword.mock.calls).toHaveLength(0)
  })

  it('rejeita sessão ausente e usuário sem e-mail com erros sanitizados', async () => {
    const { operations } = createRepository()
    const input = {
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova',
    }

    await expect(
      new FirebaseAuthRepository(
        { currentUser: null } as Auth,
        operations,
      ).updatePassword(input),
    ).rejects.toMatchObject({
      code: 'password-update-user-not-authenticated',
      message: 'Não foi possível identificar a sessão atual. Entre novamente.',
    })

    await expect(
      new FirebaseAuthRepository(
        { currentUser: { ...firebaseUser, email: null } } as Auth,
        operations,
      ).updatePassword(input),
    ).rejects.toMatchObject({ code: 'user-email-unavailable' })
  })

  it.each(reauthenticationErrorCases)(
    'sanitiza erro de reautenticação %s',
    async (firebaseCode, domainCode, message) => {
      const { repository, operations } = createRepository()
      operations.reauthenticate.mockRejectedValueOnce({
        code: firebaseCode,
        message: 'credencial e token internos',
      })

      await expect(
        repository.updatePassword({
          currentPassword: 'senha-atual',
          newPassword: 'senha-nova',
        }),
      ).rejects.toMatchObject({
        code: domainCode,
        message,
      })
      expect(operations.updatePassword.mock.calls).toHaveLength(0)
    },
  )

  it.each([
    [
      'auth/weak-password',
      'password-update-weak-password',
      'A nova senha não atende aos requisitos de segurança.',
    ],
    [
      'auth/network-request-failed',
      'password-update-network-unavailable',
      'Não foi possível atualizar a senha. Verifique sua conexão e tente novamente.',
    ],
    [
      'auth/internal-error',
      'password-update-failed',
      'Não foi possível atualizar a senha. Tente novamente.',
    ],
  ])(
    'sanitiza erro de atualização %s',
    async (firebaseCode, domainCode, message) => {
      const { repository, operations } = createRepository()
      operations.updatePassword.mockRejectedValueOnce({
        code: firebaseCode,
        message: 'senha e stack internas',
      })

      await expect(
        repository.updatePassword({
          currentPassword: 'senha-atual',
          newPassword: 'senha-nova',
        }),
      ).rejects.toMatchObject({ code: domainCode, message })
    },
  )
})
