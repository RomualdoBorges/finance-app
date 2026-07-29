export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'email-already-in-use'
  | 'invalid-credentials'
  | 'user-disabled'
  | 'too-many-requests'
  | 'network-unavailable'
  | 'sign-out-failed'
  | 'unknown'

const authErrorMessages: Record<AuthErrorCode, string> = {
  'invalid-email': 'Informe um e-mail válido.',
  'weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'email-already-in-use': 'Este e-mail já está cadastrado.',
  'invalid-credentials': 'E-mail ou senha inválidos.',
  'user-disabled': 'Esta conta está desabilitada.',
  'too-many-requests':
    'Muitas tentativas foram realizadas. Aguarde e tente novamente.',
  'network-unavailable':
    'Não foi possível conectar. Verifique sua internet e tente novamente.',
  'sign-out-failed': 'Não foi possível sair da conta. Tente novamente.',
  unknown: 'Não foi possível concluir a autenticação. Tente novamente.',
}

export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode) {
    super(authErrorMessages[code])
    this.name = 'AuthError'
    this.code = code
  }
}
