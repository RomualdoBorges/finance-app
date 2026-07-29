export const routePaths = {
  home: '/',
  login: '/login',
  register: '/cadastro',
  passwordReset: '/recuperar-senha',
} as const

export type RoutePath = (typeof routePaths)[keyof typeof routePaths]
