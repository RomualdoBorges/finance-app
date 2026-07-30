export const routePaths = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  passwordReset: '/recuperar-senha',
  emailVerification: '/verificar-email',
  updatePassword: '/conta/alterar-senha',
} as const

export type RoutePath = (typeof routePaths)[keyof typeof routePaths]
