import type { UserProfile } from '../../user/domain/UserProfile'

export const PERSONAL_GROUP_NAME = 'Meu Financeiro'
export const PERSONAL_GROUP_TYPE = 'personal'
export const PERSONAL_GROUP_CURRENCY = 'BRL'
export const ACTIVE_GROUP_STATUS = 'active'
export const OWNER_ROLE = 'owner'

export type FinancialGroup = {
  readonly id: string
  readonly name: typeof PERSONAL_GROUP_NAME
  readonly type: typeof PERSONAL_GROUP_TYPE
  readonly currency: typeof PERSONAL_GROUP_CURRENCY
  readonly ownerId: string
  readonly status: typeof ACTIVE_GROUP_STATUS
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type GroupMembership = {
  readonly userId: string
  readonly groupId: string
  readonly role: typeof OWNER_ROLE
  readonly status: typeof ACTIVE_GROUP_STATUS
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type GroupBootstrapResult = {
  readonly group: FinancialGroup
  readonly activeGroup: FinancialGroup
  readonly membership: GroupMembership
  readonly profile: UserProfile
}

// Aliases preservam apenas a API de domínio usada pela UI; não representam
// compatibilidade com as coleções antigas do Firestore.
export type Group = FinancialGroup
export type GroupMember = GroupMembership
