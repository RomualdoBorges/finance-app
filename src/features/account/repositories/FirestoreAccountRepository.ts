import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Query,
} from 'firebase/firestore'

import {
  ACCOUNT_STATUSES,
  type Account,
  type PersistAccountInput,
  type PersistAccountUpdate,
} from '../domain/Account'
import { AccountError, type AccountErrorCode } from '../domain/AccountError'
import {
  ACCOUNT_TYPES,
  getAccountTypeDefaults,
  type AccountType,
} from '../domain/accountTypes'
import type { AccountRepository } from './AccountRepository'

type Snapshot = {
  readonly id: string
  readonly exists: boolean
  readonly data: unknown
}
export type FirestoreAccountOperations = {
  readonly collection: (firestore: Firestore, groupId: string) => unknown
  readonly reference: (
    firestore: Firestore,
    groupId: string,
    accountId: string,
  ) => unknown
  readonly newReference: (
    firestore: Firestore,
    groupId: string,
  ) => { readonly id: string; readonly reference: unknown }
  readonly get: (reference: unknown) => Promise<Snapshot>
  readonly list: (reference: unknown) => Promise<readonly Snapshot[]>
  readonly set: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<void>
  readonly update: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<void>
  readonly serverTimestamp: () => unknown
}

const operations: FirestoreAccountOperations = {
  collection: (firestore, groupId) =>
    collection(firestore, 'financialGroups', groupId, 'accounts'),
  reference: (firestore, groupId, accountId) =>
    doc(firestore, 'financialGroups', groupId, 'accounts', accountId),
  newReference: (firestore, groupId) => {
    const reference = doc(
      collection(firestore, 'financialGroups', groupId, 'accounts'),
    )
    return { id: reference.id, reference }
  },
  get: async (reference) => {
    const snapshot = await getDoc(reference as DocumentReference<DocumentData>)
    return {
      id: snapshot.id,
      exists: snapshot.exists(),
      data: snapshot.exists() ? snapshot.data() : undefined,
    }
  },
  list: async (reference) => {
    const snapshot = await getDocs(reference as Query<DocumentData>)
    return snapshot.docs.map((item) => ({
      id: item.id,
      exists: true,
      data: item.data(),
    }))
  },
  set: (reference, data) =>
    setDoc(reference as DocumentReference<DocumentData>, data),
  update: (reference, data) =>
    updateDoc(reference as DocumentReference<DocumentData>, data),
  serverTimestamp,
}

function date(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null || !('toDate' in value))
    return null
  const converted = (value as { toDate?: () => unknown }).toDate?.()
  return converted instanceof Date && !Number.isNaN(converted.getTime())
    ? converted
    : null
}

function nullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

export function mapAccountSnapshot(
  groupId: string,
  snapshot: Snapshot,
): Account | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null)
    throw new AccountError('invalid-data')
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = date(data['createdAt'])
  const updatedAt = date(data['updatedAt'])
  const legacyDefaults = getAccountTypeDefaults('other')
  const accountType = data['accountType'] ?? 'other'
  const includeInBalance =
    data['includeInBalance'] ?? legacyDefaults.includeInBalance
  const includeInNetWorth =
    data['includeInNetWorth'] ?? legacyDefaults.includeInNetWorth
  if (
    snapshot.id.length === 0 ||
    data['groupId'] !== groupId ||
    typeof data['name'] !== 'string' ||
    typeof data['normalizedName'] !== 'string' ||
    !nullableString(data['description']) ||
    !nullableString(data['institutionName']) ||
    !nullableString(data['icon']) ||
    !nullableString(data['color']) ||
    !ACCOUNT_TYPES.includes(accountType as AccountType) ||
    typeof includeInBalance !== 'boolean' ||
    typeof includeInNetWorth !== 'boolean' ||
    !ACCOUNT_STATUSES.includes(data['status'] as Account['status']) ||
    typeof data['isArchived'] !== 'boolean' ||
    (data['status'] === 'archived') !== data['isArchived'] ||
    typeof data['createdBy'] !== 'string' ||
    createdAt === null ||
    updatedAt === null
  )
    throw new AccountError('invalid-data')
  return {
    id: snapshot.id,
    groupId,
    name: data['name'],
    normalizedName: data['normalizedName'],
    description: data['description'],
    institutionName: data['institutionName'],
    icon: data['icon'],
    color: data['color'],
    accountType: accountType as AccountType,
    includeInBalance,
    includeInNetWorth,
    status: data['status'] as Account['status'],
    isArchived: data['isArchived'],
    createdBy: data['createdBy'],
    createdAt,
    updatedAt,
  }
}

function identifier(value: string): void {
  if (value.trim().length === 0 || value.includes('/'))
    throw new AccountError('invalid-input')
}

function mapError(error: unknown): AccountError {
  if (error instanceof AccountError) return error
  const raw =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : ''
  const codes: Readonly<Record<string, AccountErrorCode>> = {
    'permission-denied': 'permission-denied',
    'firestore/permission-denied': 'permission-denied',
    unauthenticated: 'unauthenticated',
    'firestore/unauthenticated': 'unauthenticated',
    unavailable: 'unavailable',
    'firestore/unavailable': 'unavailable',
  }
  return new AccountError(codes[raw] ?? 'unknown', { cause: error })
}

export class FirestoreAccountRepository implements AccountRepository {
  private readonly firestore: Firestore
  private readonly ops: FirestoreAccountOperations

  constructor(
    firestore: Firestore,
    ops: FirestoreAccountOperations = operations,
  ) {
    this.firestore = firestore
    this.ops = ops
  }

  async listByGroup(groupId: string): Promise<readonly Account[]> {
    identifier(groupId)
    try {
      return (
        await this.ops.list(this.ops.collection(this.firestore, groupId))
      ).map((snapshot) => {
        const account = mapAccountSnapshot(groupId, snapshot)
        if (account === null) throw new AccountError('invalid-data')
        return account
      })
    } catch (error) {
      throw mapError(error)
    }
  }

  async create(input: PersistAccountInput): Promise<Account> {
    identifier(input.groupId)
    try {
      const generated = this.ops.newReference(this.firestore, input.groupId)
      const timestamp = this.ops.serverTimestamp()
      await this.ops.set(generated.reference, {
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      const account = mapAccountSnapshot(
        input.groupId,
        await this.ops.get(generated.reference),
      )
      if (account === null) throw new AccountError('invalid-data')
      return account
    } catch (error) {
      throw mapError(error)
    }
  }

  async update(
    groupId: string,
    accountId: string,
    input: PersistAccountUpdate,
  ): Promise<Account> {
    identifier(groupId)
    identifier(accountId)
    try {
      const reference = this.ops.reference(this.firestore, groupId, accountId)
      await this.ops.update(reference, {
        ...input,
        updatedAt: this.ops.serverTimestamp(),
      })
      const account = mapAccountSnapshot(groupId, await this.ops.get(reference))
      if (account === null) throw new AccountError('invalid-data')
      return account
    } catch (error) {
      throw mapError(error)
    }
  }

  async setArchived(
    groupId: string,
    accountId: string,
    archived: boolean,
  ): Promise<void> {
    identifier(groupId)
    identifier(accountId)
    try {
      await this.ops.update(
        this.ops.reference(this.firestore, groupId, accountId),
        {
          status: archived ? 'archived' : 'active',
          isArchived: archived,
          updatedAt: this.ops.serverTimestamp(),
        },
      )
    } catch (error) {
      throw mapError(error)
    }
  }
}
