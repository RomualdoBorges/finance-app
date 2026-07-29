export const routePaths = {
  home: '/',
  login: '/login',
} as const

export type RoutePath = (typeof routePaths)[keyof typeof routePaths]
