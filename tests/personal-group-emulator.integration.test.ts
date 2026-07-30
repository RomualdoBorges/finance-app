import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  type Auth,
} from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { FirestoreGroupRepository } from '../src/features/group/repositories/FirestoreGroupRepository'
import { FirestoreMembershipRepository } from '../src/features/group/repositories/FirestoreMembershipRepository'
import { FirestorePersonalGroupProvisioningRepository } from '../src/features/group/repositories/FirestorePersonalGroupProvisioningRepository'
import { GroupService } from '../src/features/group/services/GroupService'
import { FirestoreUserRepository } from '../src/features/user/repositories/FirestoreUserRepository'
import { FirestoreCategoryRepository } from '../src/features/category/repositories/FirestoreCategoryRepository'
import { CategoryService } from '../src/features/category/services/CategoryService'
import { defaultCategoryCatalog } from '../src/features/category/domain/defaultCategoryCatalog'

type TestClient = {
  readonly app: FirebaseApp
  readonly auth: Auth
  readonly firestore: Firestore
}

const clients: TestClient[] = []

function createClient(label: string): TestClient {
  const app = initializeApp(
    {
      apiKey: 'fake-api-key',
      authDomain: 'finance-app-dev-23ac7.firebaseapp.com',
      projectId: 'finance-app-dev-23ac7',
      appId: '1:000000000000:web:0000000000000000000000',
    },
    `integration-${label}-${crypto.randomUUID()}`,
  )
  const auth = getAuth(app)
  const firestore = getFirestore(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true,
  })
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  const client = { app, auth, firestore }
  clients.push(client)
  return client
}

function createGroupService(firestore: Firestore) {
  const users = new FirestoreUserRepository(firestore)
  return {
    users,
    groups: new FirestoreGroupRepository(firestore),
    memberships: new FirestoreMembershipRepository(firestore),
    service: new GroupService(
      new FirestorePersonalGroupProvisioningRepository(firestore),
      new FirestoreGroupRepository(firestore),
      new FirestoreMembershipRepository(firestore),
      users,
    ),
  }
}

function createCategoryService(firestore: Firestore) {
  return new CategoryService(new FirestoreCategoryRepository(firestore))
}

beforeAll(() => {
  // A limpeza do Firestore é feita pelo arquivo de Rules no mesmo worker.
})

afterAll(async () => {
  await Promise.all(clients.map(async ({ app }) => deleteApp(app)))
})

describe('bootstrap pessoal contra Auth e Firestore Emulators', () => {
  it('persiste, relê, é idempotente e isola dois usuários', async () => {
    const first = createClient('first')
    const firstCredential = await createUserWithEmailAndPassword(
      first.auth,
      `first-${crypto.randomUUID()}@example.com`,
      'senha-segura',
    )
    const firstDependencies = createGroupService(first.firestore)
    const authenticatedUser = {
      uid: firstCredential.user.uid,
      email: firstCredential.user.email,
      displayName: firstCredential.user.displayName,
      photoURL: firstCredential.user.photoURL,
      emailVerified: firstCredential.user.emailVerified,
    }
    await firstDependencies.users.ensureUserProfile(authenticatedUser)

    const initial = await firstDependencies.service.bootstrapPersonalGroup({
      userId: authenticatedUser.uid,
    })
    const repeated = await firstDependencies.service.bootstrapPersonalGroup({
      userId: authenticatedUser.uid,
    })
    const reloadedProfile = await firstDependencies.users.getUserProfile(
      authenticatedUser.uid,
    )
    const reloadedGroup = await firstDependencies.groups.getGroupById(
      initial.activeGroup.id,
    )
    const categoryService = createCategoryService(first.firestore)
    const initialCategories = await categoryService.ensureDefaultCategories({
      groupId: initial.activeGroup.id,
      userId: authenticatedUser.uid,
    })
    const repeatedCategories = await categoryService.ensureDefaultCategories({
      groupId: initial.activeGroup.id,
      userId: authenticatedUser.uid,
    })
    const customCategory = await categoryService.createCustomCategory(
      {
        groupId: initial.activeGroup.id,
        userId: authenticatedUser.uid,
      },
      { name: 'Pets', type: 'expense' },
    )
    const customSubcategory = await categoryService.createCustomCategory(
      {
        groupId: initial.activeGroup.id,
        userId: authenticatedUser.uid,
      },
      {
        name: 'Veterinário',
        type: 'expense',
        parentCategoryId: customCategory.id,
      },
    )
    const reloadedCategories = await categoryService.listByGroup(
      initial.activeGroup.id,
    )

    expect(reloadedProfile?.activeGroupId).toBe(initial.activeGroup.id)
    expect(reloadedGroup).toEqual(initial.activeGroup)
    expect(repeated.group.createdAt).toEqual(initial.group.createdAt)
    expect(repeated.group.updatedAt).toEqual(initial.group.updatedAt)
    expect(repeated.membership.createdAt).toEqual(initial.membership.createdAt)
    expect(repeated.membership.updatedAt).toEqual(initial.membership.updatedAt)
    expect(initialCategories).toHaveLength(defaultCategoryCatalog.length)
    expect(repeatedCategories).toHaveLength(defaultCategoryCatalog.length)
    expect(repeatedCategories[0]?.createdAt).toEqual(
      initialCategories[0]?.createdAt,
    )
    expect(reloadedCategories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: customCategory.id, origin: 'custom' }),
        expect.objectContaining({
          id: customSubcategory.id,
          parentCategoryId: customCategory.id,
        }),
      ]),
    )
    await expect(
      categoryService.createCustomCategory(
        {
          groupId: initial.activeGroup.id,
          userId: authenticatedUser.uid,
        },
        { name: ' PÉTS ', type: 'expense' },
      ),
    ).rejects.toMatchObject({ code: 'duplicate' })

    const second = createClient('second')
    const secondCredential = await createUserWithEmailAndPassword(
      second.auth,
      `second-${crypto.randomUUID()}@example.com`,
      'senha-segura',
    )
    const secondGroups = new FirestoreGroupRepository(second.firestore)
    await expect(
      secondGroups.getGroupById(firstCredential.user.uid),
    ).rejects.toMatchObject({ code: 'permission-denied' })
    await expect(
      createCategoryService(second.firestore).listByGroup(
        firstCredential.user.uid,
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})
