export type CategoryErrorCode =
  | 'invalid-input'
  | 'invalid-data'
  | 'parent-not-found'
  | 'category-not-found'
  | 'parent-is-subcategory'
  | 'parent-archived'
  | 'type-mismatch'
  | 'duplicate'
  | 'default-delete-forbidden'
  | 'root-delete-forbidden'
  | 'category-in-use'
  | 'active-children'
  | 'invalid-relationship'
  | 'permission-denied'
  | 'unauthenticated'
  | 'unavailable'
  | 'unknown'

const messages: Readonly<Record<CategoryErrorCode, string>> = {
  'invalid-input': 'Revise os dados informados para a categoria.',
  'invalid-data': 'Os dados armazenados para esta categoria são inválidos.',
  'parent-not-found': 'A categoria principal selecionada não foi encontrada.',
  'category-not-found': 'A categoria selecionada não foi encontrada.',
  'parent-is-subcategory':
    'Uma subcategoria não pode conter outra subcategoria.',
  'parent-archived':
    'Uma subcategoria precisa de uma categoria principal ativa.',
  'type-mismatch':
    'A subcategoria deve ter o mesmo tipo da categoria principal.',
  duplicate: 'Já existe uma categoria com esse nome neste nível.',
  'default-delete-forbidden': 'Categorias padrão não podem ser excluídas.',
  'root-delete-forbidden':
    'Categorias principais devem ser arquivadas para preservar a hierarquia.',
  'category-in-use':
    'Esta categoria já foi usada e deve ser arquivada para preservar o histórico.',
  'active-children':
    'A categoria possui subcategorias ativas que precisam ser tratadas juntas.',
  'invalid-relationship': 'O relacionamento entre as categorias é inválido.',
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
