import type { GroupMembership } from '../domain/Group'

export type MembershipIdentity = {
  readonly userId: string
  readonly groupId: string
}

export interface MembershipRepository {
  getMembership(input: MembershipIdentity): Promise<GroupMembership | null>
}
