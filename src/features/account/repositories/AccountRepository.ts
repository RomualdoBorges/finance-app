import type {
  Account,
  PersistAccountInput,
  PersistAccountUpdate,
} from '../domain/Account'

export interface AccountRepository {
  listByGroup(groupId: string): Promise<readonly Account[]>
  create(input: PersistAccountInput): Promise<Account>
  update(
    groupId: string,
    accountId: string,
    input: PersistAccountUpdate,
  ): Promise<Account>
  setArchived(
    groupId: string,
    accountId: string,
    archived: boolean,
  ): Promise<void>
}
