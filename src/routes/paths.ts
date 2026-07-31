export const routePaths = {
  home: '/',
  authenticatedHome: '/',
  login: '/entrar',
  register: '/cadastro',
  passwordReset: '/recuperar-senha',
  emailVerification: '/verificar-email',
  updatePassword: '/conta/alterar-senha',
  deleteAccount: '/conta/excluir',
  categories: '/categorias',
  accounts: '/contas',
} as const

export type RoutePath = (typeof routePaths)[keyof typeof routePaths]
