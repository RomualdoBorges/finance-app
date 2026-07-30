import type { FinancialGroup } from '../domain/Group'

export interface GroupRepository {
  getGroupById(groupId: string): Promise<FinancialGroup | null>
}
