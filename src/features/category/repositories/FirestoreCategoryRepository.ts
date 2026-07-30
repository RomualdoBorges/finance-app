import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Query,
} from 'firebase/firestore'

import {
  ACTIVE_CATEGORY_STATUS,
  CATEGORY_ORIGINS,
  CATEGORY_TYPES,
  type Category,
  type PersistCategoryInput,
} from '../domain/Category'
import { CategoryError, type CategoryErrorCode } from '../domain/CategoryError'
import type {
  CategoryRepository,
  EnsureDefaultCategoriesInput,
} from './CategoryRepository'

type CategorySnapshot = {
  readonly id: string
  readonly exists: boolean
  readonly data: unknown
}

type CategoryBatch = {
  set(reference: unknown, data: Readonly<Record<string, unknown>>): void
  commit(): Promise<void>
}

export type FirestoreCategoryOperations = {
  readonly categoryCollection: (
    firestore: Firestore,
    groupId: string,
  ) => unknown
  readonly categoryReference: (
    firestore: Firestore,
    groupId: string,
    categoryId: string,
  ) => unknown
  readonly newCategoryReference: (
    firestore: Firestore,
    groupId: string,
  ) => { readonly id: string; readonly reference: unknown }
  readonly getCategory: (reference: unknown) => Promise<CategorySnapshot>
  readonly listCategories: (
    reference: unknown,
  ) => Promise<readonly CategorySnapshot[]>
  readonly setCategory: (
    reference: unknown,
    data: Readonly<Record<string, unknown>>,
  ) => Promise<void>
  readonly createBatch: (firestore: Firestore) => CategoryBatch
  readonly serverTimestamp: () => unknown
}

const defaultOperations: FirestoreCategoryOperations = {
  categoryCollection: (firestore, groupId) =>
    collection(firestore, 'financialGroups', groupId, 'categories'),
  categoryReference: (firestore, groupId, categoryId) =>
    doc(firestore, 'financialGroups', groupId, 'categories', categoryId),
  newCategoryReference: (firestore, groupId) => {
    const reference = doc(
      collection(firestore, 'financialGroups', groupId, 'categories'),
    )
    return { id: reference.id, reference }
  },
  getCategory: async (reference) => {
    const snapshot = await getDoc(reference as DocumentReference<DocumentData>)
    return {
      id: snapshot.id,
      exists: snapshot.exists(),
      data: snapshot.exists() ? snapshot.data() : undefined,
    }
  },
  listCategories: async (reference) => {
    const snapshot = await getDocs(reference as Query<DocumentData>)
    return snapshot.docs.map((item) => ({
      id: item.id,
      exists: true,
      data: item.data(),
    }))
  },
  setCategory: (reference, data) =>
    setDoc(reference as DocumentReference<DocumentData>, data),
  createBatch: (firestore) => writeBatch(firestore),
  serverTimestamp,
}

function getErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
    ? error.code
    : undefined
}

export function mapCategoryError(error: unknown): CategoryError {
  if (error instanceof CategoryError) return error

  const codeMap: Readonly<Record<string, CategoryErrorCode>> = {
    'permission-denied': 'permission-denied',
    'firestore/permission-denied': 'permission-denied',
    unauthenticated: 'unauthenticated',
    'firestore/unauthenticated': 'unauthenticated',
    unavailable: 'unavailable',
    'firestore/unavailable': 'unavailable',
  }
  const code = getErrorCode(error)
  return new CategoryError(
    code === undefined ? 'unknown' : (codeMap[code] ?? 'unknown'),
    { cause: error },
  )
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null) return null
  const timestamp = value as { readonly toDate?: () => unknown }
  if (typeof timestamp.toDate !== 'function') return null
  const date = timestamp.toDate()
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null
}

export function mapCategorySnapshot(
  groupId: string,
  snapshot: CategorySnapshot,
): Category | null {
  if (!snapshot.exists) return null
  if (typeof snapshot.data !== 'object' || snapshot.data === null) {
    throw new CategoryError('invalid-data')
  }
  const data = snapshot.data as Readonly<Record<string, unknown>>
  const createdAt = toDate(data['createdAt'])
  const updatedAt = toDate(data['updatedAt'])
  const name = data['name']
  const normalizedName = data['normalizedName']
  const type = data['type']
  const origin = data['origin']
  const parentCategoryId = data['parentCategoryId']
  const icon = data['icon']
  const createdBy = data['createdBy']

  if (
    snapshot.id.length === 0 ||
    data['groupId'] !== groupId ||
    typeof name !== 'string' ||
    typeof normalizedName !== 'string' ||
    !CATEGORY_TYPES.includes(type as (typeof CATEGORY_TYPES)[number]) ||
    !CATEGORY_ORIGINS.includes(origin as (typeof CATEGORY_ORIGINS)[number]) ||
    data['status'] !== ACTIVE_CATEGORY_STATUS ||
    !isNullableString(parentCategoryId) ||
    !isNullableString(icon) ||
    typeof createdBy !== 'string' ||
    createdAt === null ||
    updatedAt === null
  ) {
    throw new CategoryError('invalid-data')
  }

  return {
    id: snapshot.id,
    groupId,
    name,
    normalizedName,
    type: type as Category['type'],
    origin: origin as Category['origin'],
    status: ACTIVE_CATEGORY_STATUS,
    parentCategoryId,
    icon,
    createdBy,
    createdAt,
    updatedAt,
  }
}

function assertIdentifier(value: string): void {
  if (value.trim().length === 0 || value.includes('/')) {
    throw new CategoryError('invalid-input')
  }
}

function persistedData(
  input: PersistCategoryInput,
  timestamp: unknown,
): Readonly<Record<string, unknown>> {
  return {
    groupId: input.groupId,
    name: input.name,
    normalizedName: input.normalizedName,
    type: input.type,
    origin: input.origin,
    status: input.status,
    parentCategoryId: input.parentCategoryId,
    icon: input.icon,
    createdBy: input.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export class FirestoreCategoryRepository implements CategoryRepository {
  private readonly firestore: Firestore
  private readonly operations: FirestoreCategoryOperations

  constructor(
    firestore: Firestore,
    operations: FirestoreCategoryOperations = defaultOperations,
  ) {
    this.firestore = firestore
    this.operations = operations
  }

  async listByGroup(groupId: string): Promise<readonly Category[]> {
    assertIdentifier(groupId)
    try {
      const reference = this.operations.categoryCollection(
        this.firestore,
        groupId,
      )
      const snapshots = await this.operations.listCategories(reference)
      return snapshots.map((snapshot) => {
        const category = mapCategorySnapshot(groupId, snapshot)
        if (category === null) throw new CategoryError('invalid-data')
        return category
      })
    } catch (error) {
      throw mapCategoryError(error)
    }
  }

  async getById(groupId: string, categoryId: string): Promise<Category | null> {
    assertIdentifier(groupId)
    assertIdentifier(categoryId)
    try {
      const reference = this.operations.categoryReference(
        this.firestore,
        groupId,
        categoryId,
      )
      return mapCategorySnapshot(
        groupId,
        await this.operations.getCategory(reference),
      )
    } catch (error) {
      throw mapCategoryError(error)
    }
  }

  async create(input: PersistCategoryInput): Promise<Category> {
    assertIdentifier(input.groupId)
    try {
      const generated = this.operations.newCategoryReference(
        this.firestore,
        input.groupId,
      )
      const timestamp = this.operations.serverTimestamp()
      await this.operations.setCategory(
        generated.reference,
        persistedData({ ...input, id: generated.id }, timestamp),
      )
      const materialized = await this.operations.getCategory(
        generated.reference,
      )
      const category = mapCategorySnapshot(input.groupId, materialized)
      if (category === null) throw new CategoryError('invalid-data')
      return category
    } catch (error) {
      throw mapCategoryError(error)
    }
  }

  async ensureDefaults({
    groupId,
    userId,
    definitions,
  }: EnsureDefaultCategoriesInput): Promise<void> {
    assertIdentifier(groupId)
    assertIdentifier(userId)
    try {
      const snapshots = await this.operations.listCategories(
        this.operations.categoryCollection(this.firestore, groupId),
      )
      const existingIds = new Set(snapshots.map(({ id }) => id))
      const missing = definitions.filter(
        (definition) => !existingIds.has(definition.id),
      )
      if (missing.length === 0) return

      const batch = this.operations.createBatch(this.firestore)
      const timestamp = this.operations.serverTimestamp()
      for (const definition of missing) {
        const reference = this.operations.categoryReference(
          this.firestore,
          groupId,
          definition.id,
        )
        batch.set(
          reference,
          persistedData(
            {
              ...definition,
              groupId,
              origin: 'default',
              status: ACTIVE_CATEGORY_STATUS,
              createdBy: userId,
            },
            timestamp,
          ),
        )
      }
      await batch.commit()
    } catch (error) {
      throw mapCategoryError(error)
    }
  }
}
