import type { UserRepository } from '../../user/repositories/UserRepository'
import {
  type GroupBootstrapResult,
  type FinancialGroup,
  type GroupMembership,
} from '../domain/Group'
import { GroupError } from '../domain/GroupError'
import type { GroupRepository } from '../repositories/GroupRepository'
import type { MembershipRepository } from '../repositories/MembershipRepository'
import type { PersonalGroupProvisioningRepository } from '../repositories/PersonalGroupProvisioningRepository'

export const personalGroupIdForUser = (userId: string): string => userId

export class GroupService {
  private readonly provisioningRepository: PersonalGroupProvisioningRepository
  private readonly groupRepository: GroupRepository
  private readonly membershipRepository: MembershipRepository
  private readonly userRepository: UserRepository

  constructor(
    provisioningRepository: PersonalGroupProvisioningRepository,
    groupRepository: GroupRepository,
    membershipRepository: MembershipRepository,
    userRepository: UserRepository,
  ) {
    this.provisioningRepository = provisioningRepository
    this.groupRepository = groupRepository
    this.membershipRepository = membershipRepository
    this.userRepository = userRepository
  }

  async bootstrapPersonalGroup(input: {
    readonly userId: string
  }): Promise<GroupBootstrapResult> {
    const groupId = personalGroupIdForUser(input.userId)
    await this.provisioningRepository.ensurePersonalGroupAndOwner({
      userId: input.userId,
      groupId,
    })

    const [group, membership] = await Promise.all([
      this.groupRepository.getGroupById(groupId),
      this.membershipRepository.getMembership({
        userId: input.userId,
        groupId,
      }),
    ])
    if (group === null || membership === null) {
      throw new GroupError('not-found')
    }

    const profile = await this.userRepository.ensureActiveGroupId({
      userId: input.userId,
      groupId,
    })
    const activeGroup = await this.loadActiveGroup(profile.activeGroupId)

    return { group, activeGroup, membership, profile }
  }

  private async loadActiveGroup(
    activeGroupId: string | null,
  ): Promise<FinancialGroup> {
    if (activeGroupId === null) throw new GroupError('not-found')
    const activeGroup = await this.groupRepository.getGroupById(activeGroupId)
    if (activeGroup === null) throw new GroupError('not-found')
    return activeGroup
  }

  getGroupById(groupId: string): Promise<FinancialGroup | null> {
    return this.groupRepository.getGroupById(groupId)
  }

  getMembership(input: {
    readonly userId: string
    readonly groupId: string
  }): Promise<GroupMembership | null> {
    return this.membershipRepository.getMembership(input)
  }
}
