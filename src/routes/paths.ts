export const routePaths = {
  home: '/',
  login: '/login',
  register: '/cadastro',
} as const

export type RoutePath = (typeof routePaths)[keyof typeof routePaths]
