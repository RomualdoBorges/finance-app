export type UserProfileErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'unavailable'
  | 'not-found'
  | 'invalid-profile'
  | 'unknown'

const messages: Record<UserProfileErrorCode, string> = {
  unauthenticated: 'Não foi possível identificar a sessão atual.',
  'permission-denied': 'Não foi possível acessar os dados da sua conta.',
  unavailable: 'Não foi possível carregar os dados da conta. Tente novamente.',
  'not-found': 'Não foi possível encontrar os dados da sua conta.',
  'invalid-profile': 'Não foi possível carregar os dados da conta.',
  unknown: 'Não foi possível carregar os dados da conta.',
}

export class UserProfileError extends Error {
  readonly code: UserProfileErrorCode

  constructor(code: UserProfileErrorCode) {
    super(messages[code])
    this.name = 'UserProfileError'
    this.code = code
  }
}
