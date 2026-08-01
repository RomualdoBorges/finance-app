export type AccountErrorCode =
  | 'invalid-input'
  | 'invalid-data'
  | 'account-not-found'
  | 'duplicate'
  | 'permission-denied'
  | 'unauthenticated'
  | 'unavailable'
  | 'unknown'

const messages: Readonly<Record<AccountErrorCode, string>> = {
  'invalid-input': 'Revise os dados informados para a conta.',
  'invalid-data': 'Os dados armazenados para esta conta são inválidos.',
  'account-not-found': 'A conta selecionada não foi encontrada.',
  duplicate: 'Já existe uma conta ativa com esse nome.',
  'permission-denied': 'Você não tem permissão para acessar estas contas.',
  unauthenticated: 'Entre na sua conta para acessar as contas.',
  unavailable: 'O serviço de contas está indisponível no momento.',
  unknown: 'Não foi possível concluir a operação com contas.',
}

export class AccountError extends Error {
  readonly code: AccountErrorCode

  constructor(code: AccountErrorCode, options?: ErrorOptions) {
    super(messages[code], options)
    this.name = 'AccountError'
    this.code = code
  }
}
