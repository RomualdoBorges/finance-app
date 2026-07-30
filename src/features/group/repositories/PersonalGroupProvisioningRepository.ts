export type PersonalGroupIdentity = {
  readonly userId: string
  readonly groupId: string
}

export interface PersonalGroupProvisioningRepository {
  ensurePersonalGroupAndOwner(input: PersonalGroupIdentity): Promise<void>
}
