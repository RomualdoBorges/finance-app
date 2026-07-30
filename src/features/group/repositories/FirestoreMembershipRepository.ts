import {
  doc,
  getDoc,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore'

import {
  ACTIVE_GROUP_STATUS,
  OWNER_ROLE,
  type GroupMembership,
} from '../domain/Group'
import { GroupError } from '../domain/GroupError'
import {
  firestoreTimestampToDate,
  mapGroupError,
  snapshotFromFirebase,
  validateFirestoreId,
  type FirestoreSnapshot,
} from './FirestoreGroupRepository'
import type {
  MembershipIdentity,
  MembershipRepository,
} from './MembershipRepository'

export type FirestoreMembershipOperations = {
  readonly membershipReference: (
    firestore: Firestore,
    groupId: string,
    userId: string,
  ) => unknown
  readonly getDocument: (reference: unknown) => Promise<FirestoreSnapshot>
}

const defaultOperations: FirestoreMembershipOperations = {
  membershipReference: (firestore, groupId, userId) =>
    doc(firestore, 'financialGroups', groupId, 'members', userId),
  getDocument: async (reference) =>
    snapshotFromFirebase(
      await getDoc(reference as DocumentReference<DocumentData>),
    ),
}

export function mapMembershipSnapshot(
  snapshot: FirestoreSnapshot,
): GroupMembership | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null) {
    throw new GroupError('invalid-data')
  }
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = firestoreTimestampToDate(data['createdAt'])
  const updatedAt = firestoreTimestampToDate(data['updatedAt'])
  if (
    snapshot.id.trim().length === 0 ||
    typeof data['groupId'] !== 'string' ||
    typeof data['userId'] !== 'string' ||
    data['role'] !== OWNER_ROLE ||
    data['status'] !== ACTIVE_GROUP_STATUS ||
    createdAt === null ||
    updatedAt === null
  ) {
    throw new GroupError('invalid-data')
  }
  return {
    groupId: data['groupId'],
    userId: data['userId'],
    role: data['role'],
    status: data['status'],
    createdAt,
    updatedAt,
  }
}

export class FirestoreMembershipRepository implements MembershipRepository {
  private readonly firestore: Firestore
  private readonly operations: FirestoreMembershipOperations

  constructor(
    firestore: Firestore,
    operations: FirestoreMembershipOperations = defaultOperations,
  ) {
    this.firestore = firestore
    this.operations = operations
  }

  async getMembership({
    groupId,
    userId,
  }: MembershipIdentity): Promise<GroupMembership | null> {
    validateFirestoreId(groupId)
    validateFirestoreId(userId)
    try {
      const membership = mapMembershipSnapshot(
        await this.operations.getDocument(
          this.operations.membershipReference(this.firestore, groupId, userId),
        ),
      )
      if (
        membership !== null &&
        (membership.groupId !== groupId || membership.userId !== userId)
      ) {
        throw new GroupError('invalid-data')
      }
      return membership
    } catch (error) {
      throw mapGroupError(error)
    }
  }
}
