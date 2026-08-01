export type AuthenticatedUser = {
  readonly uid: string
  readonly email: string | null
  readonly displayName: string | null
  readonly photoURL: string | null
  readonly emailVerified: boolean
}
