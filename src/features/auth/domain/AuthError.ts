export type AuthErrorCode =
  | 'invalid-email'
  | 'weak-password'
  | 'email-already-in-use'
  | 'invalid-credentials'
  | 'user-disabled'
  | 'too-many-requests'
  | 'network-unavailable'
  | 'sign-out-failed'
  | 'password-reset-failed'
  | 'email-verification-failed'
  | 'user-not-authenticated'
  | 'user-email-unavailable'
  | 'password-update-user-not-authenticated'
  | 'incorrect-current-password'
  | 'current-credential-invalid'
  | 'recent-login-required'
  | 'password-update-weak-password'
  | 'password-update-network-unavailable'
  | 'password-update-failed'
  | 'account-deletion-user-not-authenticated'
  | 'account-deletion-user-not-found'
  | 'account-deletion-network-unavailable'
  | 'account-deletion-failed'
  | 'unknown'

const authErrorMessages: Record<AuthErrorCode, string> = {
  'invalid-email': 'Informe um e-mail válido.',
  'weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'email-already-in-use': 'Este e-mail já está cadastrado.',
  'invalid-credentials': 'E-mail ou senha inválidos.',
  'user-disabled': 'Esta conta está desabilitada.',
  'too-many-requests':
    'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.',
  'network-unavailable':
    'Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.',
  'sign-out-failed': 'Não foi possível sair da conta. Tente novamente.',
  'password-reset-failed':
    'Não foi possível solicitar a recuperação de senha. Tente novamente.',
  'email-verification-failed':
    'Não foi possível enviar o e-mail de verificação. Tente novamente.',
  'user-not-authenticated':
    'Sua sessão não está disponível. Entre novamente para continuar.',
  'user-email-unavailable': 'Não foi possível atualizar a senha desta conta.',
  'password-update-user-not-authenticated':
    'Não foi possível identificar a sessão atual. Entre novamente.',
  'incorrect-current-password': 'A senha atual está incorreta.',
  'current-credential-invalid': 'Não foi possível confirmar sua senha atual.',
  'recent-login-required':
    'Sua sessão precisa ser confirmada novamente. Informe sua senha atual e tente outra vez.',
  'password-update-weak-password':
    'A nova senha não atende aos requisitos de segurança.',
  'password-update-network-unavailable':
    'Não foi possível atualizar a senha. Verifique sua conexão e tente novamente.',
  'password-update-failed':
    'Não foi possível atualizar a senha. Tente novamente.',
  'account-deletion-user-not-authenticated':
    'Não foi possível identificar a sessão atual. Entre novamente.',
  'account-deletion-user-not-found':
    'Esta conta não está mais disponível. Entre novamente.',
  'account-deletion-network-unavailable':
    'Não foi possível excluir a conta. Verifique sua conexão e tente novamente.',
  'account-deletion-failed':
    'Não foi possível excluir a conta. Tente novamente.',
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
