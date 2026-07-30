export type CategoryErrorCode =
  | 'invalid-input'
  | 'invalid-data'
  | 'parent-not-found'
  | 'parent-is-subcategory'
  | 'type-mismatch'
  | 'duplicate'
  | 'permission-denied'
  | 'unauthenticated'
  | 'unavailable'
  | 'unknown'

const messages: Readonly<Record<CategoryErrorCode, string>> = {
  'invalid-input': 'Revise os dados informados para a categoria.',
  'invalid-data': 'Os dados armazenados para esta categoria são inválidos.',
  'parent-not-found': 'A categoria principal selecionada não foi encontrada.',
  'parent-is-subcategory':
    'Uma subcategoria não pode conter outra subcategoria.',
  'type-mismatch':
    'A subcategoria deve ter o mesmo tipo da categoria principal.',
  duplicate: 'Já existe uma categoria com esse nome neste nível.',
  'permission-denied': 'Você não tem permissão para acessar estas categorias.',
  unauthenticated: 'Entre na sua conta para acessar as categorias.',
  unavailable: 'O serviço de categorias está indisponível no momento.',
  unknown: 'Não foi possível concluir a operação com categorias.',
}

export class CategoryError extends Error {
  readonly code: CategoryErrorCode

  constructor(code: CategoryErrorCode, options?: ErrorOptions) {
    super(messages[code], options)
    this.name = 'CategoryError'
    this.code = code
  }
}
