export type UserProfile = {
  readonly id: string
  readonly email: string | null
  readonly displayName: string | null
  readonly photoURL: string | null
  readonly activeGroupId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}
