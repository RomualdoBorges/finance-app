export type TransactionErrorCode =
  | 'invalid-input'
  | 'invalid-data'
  | 'account-not-found'
  | 'account-archived'
  | 'category-not-found'
  | 'category-archived'
  | 'category-type-mismatch'
  | 'permission-denied'
  | 'unauthenticated'
  | 'unavailable'
  | 'unknown'

const messages: Readonly<Record<TransactionErrorCode, string>> = {
  'invalid-input': 'Revise os dados informados para o lançamento.',
  'invalid-data': 'Os dados armazenados para este lançamento são inválidos.',
  'account-not-found': 'A conta selecionada não foi encontrada neste grupo.',
  'account-archived':
    'A conta selecionada foi arquivada. Escolha uma conta ativa.',
  'category-not-found':
    'A categoria selecionada não foi encontrada neste grupo.',
  'category-archived':
    'A categoria selecionada foi arquivada. Escolha uma categoria ativa.',
  'category-type-mismatch':
    'A categoria selecionada não é compatível com o tipo do lançamento.',
  'permission-denied': 'Você não tem permissão para acessar estes lançamentos.',
  unauthenticated: 'Entre na sua conta para acessar os lançamentos.',
  unavailable: 'O serviço de lançamentos está indisponível no momento.',
  unknown: 'Não foi possível concluir a operação com lançamentos.',
}

export class TransactionError extends Error {
  readonly code: TransactionErrorCode
  constructor(code: TransactionErrorCode, options?: ErrorOptions) {
    super(messages[code], options)
    this.name = 'TransactionError'
    this.code = code
  }
}
