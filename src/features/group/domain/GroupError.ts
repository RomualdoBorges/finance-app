export type GroupErrorCode =
  | 'invalid-data'
  | 'not-found'
  | 'permission-denied'
  | 'unauthenticated'
  | 'unavailable'
  | 'unknown'

const messages: Readonly<Record<GroupErrorCode, string>> = {
  'invalid-data': 'Os dados do grupo são inválidos.',
  'not-found': 'Não foi possível carregar o grupo individual.',
  'permission-denied': 'Você não tem permissão para acessar este grupo.',
  unauthenticated: 'Entre novamente para carregar seu grupo.',
  unavailable: 'O grupo está temporariamente indisponível.',
  unknown: 'Não foi possível carregar o grupo.',
}

export class GroupError extends Error {
  readonly code: GroupErrorCode

  constructor(code: GroupErrorCode) {
    super(messages[code])
    this.name = 'GroupError'
    this.code = code
  }
}
