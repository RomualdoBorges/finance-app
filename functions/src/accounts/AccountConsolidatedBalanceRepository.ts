import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const MIN_MONEY_MINOR = -9_000_000_000_000
const MAX_MONEY_MINOR = 9_000_000_000_000

export type AccountBalanceSnapshot = {
  readonly currentBalanceMinor: number
  readonly projectedBalanceMinor: number
}

export interface AccountConsolidatedBalanceRepository {
  updateAccountConsolidatedBalances(
    groupId: string,
    accountId: string,
    snapshot: AccountBalanceSnapshot,
  ): Promise<void>
}

export type AccountConsolidatedBalanceOperations = {
  readonly update: (
    path: string,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<unknown>
  readonly serverTimestamp: () => unknown
}

const operations: AccountConsolidatedBalanceOperations = {
  update: (path, data) => getFirestore().doc(path).update(data),
  serverTimestamp: () => FieldValue.serverTimestamp(),
}

function assertIdentifier(value: string, field: string): void {
  if (value.trim().length === 0 || value.includes('/')) {
    throw new TypeError(`${field} inválido.`)
  }
}

function assertMinorAmount(value: number, field: string): void {
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_MONEY_MINOR ||
    value > MAX_MONEY_MINOR
  ) {
    throw new RangeError(`${field} deve ser um inteiro em centavos válido.`)
  }
}

export class FirebaseAdminAccountConsolidatedBalanceRepository
  implements AccountConsolidatedBalanceRepository
{
  private readonly operations: AccountConsolidatedBalanceOperations

  constructor(
    consolidatedBalanceOperations: AccountConsolidatedBalanceOperations =
      operations,
  ) {
    this.operations = consolidatedBalanceOperations
  }

  async updateAccountConsolidatedBalances(
    groupId: string,
    accountId: string,
    snapshot: AccountBalanceSnapshot,
  ): Promise<void> {
    assertIdentifier(groupId, 'groupId')
    assertIdentifier(accountId, 'accountId')
    assertMinorAmount(snapshot.currentBalanceMinor, 'currentBalanceMinor')
    assertMinorAmount(snapshot.projectedBalanceMinor, 'projectedBalanceMinor')

    await this.operations.update(
      `financialGroups/${groupId}/accounts/${accountId}`,
      {
        currentBalanceMinor: snapshot.currentBalanceMinor,
        projectedBalanceMinor: snapshot.projectedBalanceMinor,
        balancesUpdatedAt: this.operations.serverTimestamp(),
      },
    )
  }
}
