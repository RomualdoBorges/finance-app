import {
  ACTIVE_GROUP_STATUS,
  OWNER_ROLE,
  PERSONAL_GROUP_CURRENCY,
  PERSONAL_GROUP_NAME,
  PERSONAL_GROUP_TYPE,
  type FinancialGroup,
  type GroupMembership,
} from '../domain/Group'
import type { GroupRepository } from './GroupRepository'
import type {
  MembershipIdentity,
  MembershipRepository,
} from './MembershipRepository'
import type {
  PersonalGroupIdentity,
  PersonalGroupProvisioningRepository,
} from './PersonalGroupProvisioningRepository'

export class E2EGroupRepository
  implements
    GroupRepository,
    MembershipRepository,
    PersonalGroupProvisioningRepository
{
  private readonly groups = new Map<string, FinancialGroup>()
  private readonly memberships = new Map<string, GroupMembership>()

  ensurePersonalGroupAndOwner({
    groupId,
    userId,
  }: PersonalGroupIdentity): Promise<void> {
    const timestamp = new Date('2026-01-01T00:00:00Z')
    this.groups.set(
      groupId,
      this.groups.get(groupId) ?? {
        id: groupId,
        name: PERSONAL_GROUP_NAME,
        type: PERSONAL_GROUP_TYPE,
        currency: PERSONAL_GROUP_CURRENCY,
        ownerId: userId,
        status: ACTIVE_GROUP_STATUS,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    )
    const membershipKey = `${groupId}:${userId}`
    this.memberships.set(
      membershipKey,
      this.memberships.get(membershipKey) ?? {
        groupId,
        userId,
        role: OWNER_ROLE,
        status: ACTIVE_GROUP_STATUS,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    )
    return Promise.resolve()
  }

  getGroupById(groupId: string): Promise<FinancialGroup | null> {
    return Promise.resolve(this.groups.get(groupId) ?? null)
  }

  getMembership({
    groupId,
    userId,
  }: MembershipIdentity): Promise<GroupMembership | null> {
    return Promise.resolve(this.memberships.get(`${groupId}:${userId}`) ?? null)
  }
}
