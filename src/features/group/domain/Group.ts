export const PERSONAL_GROUP_NAME = 'Meu Financeiro'

export type Group = {
  readonly id: string
  readonly name: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type GroupMember = {
  readonly id: string
  readonly groupId: string
  readonly userId: string
  readonly role: 'OWNER'
  readonly createdAt: Date
}

export type PersonalGroup = {
  readonly group: Group
  readonly membership: GroupMember
}
