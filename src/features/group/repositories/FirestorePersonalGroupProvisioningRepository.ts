import {
  doc,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'

import {
  ACTIVE_GROUP_STATUS,
  OWNER_ROLE,
  PERSONAL_GROUP_CURRENCY,
  PERSONAL_GROUP_NAME,
  PERSONAL_GROUP_TYPE,
} from '../domain/Group'
import { GroupError } from '../domain/GroupError'
import {
  mapGroupError,
  mapGroupSnapshot,
  snapshotFromFirebase,
  validateFirestoreId,
  type FirestoreSnapshot,
} from './FirestoreGroupRepository'
import { mapMembershipSnapshot } from './FirestoreMembershipRepository'
import type {
  PersonalGroupIdentity,
  PersonalGroupProvisioningRepository,
} from './PersonalGroupProvisioningRepository'

type ProvisioningTransaction = {
  readonly get: (reference: unknown) => Promise<FirestoreSnapshot>
  readonly set: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => void
}

export type FirestoreProvisioningOperations = {
  readonly groupReference: (firestore: Firestore, groupId: string) => unknown
  readonly membershipReference: (
    firestore: Firestore,
    groupId: string,
    userId: string,
  ) => unknown
  readonly runTransaction: (
    firestore: Firestore,
    operation: (transaction: ProvisioningTransaction) => Promise<void>,
  ) => Promise<void>
  readonly serverTimestamp: () => unknown
}

const defaultOperations: FirestoreProvisioningOperations = {
  groupReference: (firestore, groupId) =>
    doc(firestore, 'financialGroups', groupId),
  membershipReference: (firestore, groupId, userId) =>
    doc(firestore, 'financialGroups', groupId, 'members', userId),
  runTransaction: (firestore, operation) =>
    runTransaction(firestore, (transaction: Transaction) =>
      operation({
        get: async (reference) =>
          snapshotFromFirebase(
            await transaction.get(reference as DocumentReference<DocumentData>),
          ),
        set: (reference, data) => {
          transaction.set(reference as DocumentReference<DocumentData>, data)
        },
      }),
    ),
  serverTimestamp,
}

export class FirestorePersonalGroupProvisioningRepository implements PersonalGroupProvisioningRepository {
  private readonly firestore: Firestore
  private readonly operations: FirestoreProvisioningOperations

  constructor(
    firestore: Firestore,
    operations: FirestoreProvisioningOperations = defaultOperations,
  ) {
    this.firestore = firestore
    this.operations = operations
  }

  async ensurePersonalGroupAndOwner({
    groupId,
    userId,
  }: PersonalGroupIdentity): Promise<void> {
    validateFirestoreId(groupId)
    validateFirestoreId(userId)
    const groupReference = this.operations.groupReference(
      this.firestore,
      groupId,
    )
    const membershipReference = this.operations.membershipReference(
      this.firestore,
      groupId,
      userId,
    )

    try {
      await this.operations.runTransaction(
        this.firestore,
        async (transaction) => {
          const groupSnapshot = await transaction.get(groupReference)
          const membershipSnapshot = await transaction.get(membershipReference)
          const timestamp =
            !groupSnapshot.exists || !membershipSnapshot.exists
              ? this.operations.serverTimestamp()
              : null

          if (!groupSnapshot.exists) {
            transaction.set(groupReference, {
              name: PERSONAL_GROUP_NAME,
              type: PERSONAL_GROUP_TYPE,
              currency: PERSONAL_GROUP_CURRENCY,
              ownerId: userId,
              status: ACTIVE_GROUP_STATUS,
              createdAt: timestamp,
              updatedAt: timestamp,
            })
          } else {
            const group = mapGroupSnapshot(groupSnapshot)
            if (group?.ownerId !== userId) throw new GroupError('invalid-data')
          }

          if (!membershipSnapshot.exists) {
            transaction.set(membershipReference, {
              userId,
              groupId,
              role: OWNER_ROLE,
              status: ACTIVE_GROUP_STATUS,
              createdAt: timestamp,
              updatedAt: timestamp,
            })
          } else {
            const membership = mapMembershipSnapshot(membershipSnapshot)
            if (
              membership?.groupId !== groupId ||
              membership.userId !== userId
            ) {
              throw new GroupError('invalid-data')
            }
          }
        },
      )
    } catch (error) {
      throw mapGroupError(error)
    }
  }
}
