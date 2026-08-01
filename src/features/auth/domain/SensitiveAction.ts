export type SensitiveOperation = 'update-password' | 'delete-account'

export type ReauthenticationRequirement = {
  readonly currentPassword: string
}

export type SensitiveAction = {
  readonly operation: SensitiveOperation
  readonly reauthentication: ReauthenticationRequirement
}
