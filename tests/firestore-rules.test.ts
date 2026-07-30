import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

let environment: RulesTestEnvironment

const validProfile = {
  email: 'pessoa@example.com',
  displayName: null,
  photoURL: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}

function groupData(ownerId: string) {
  return {
    name: 'Meu Financeiro',
    type: 'personal',
    currency: 'BRL',
    ownerId,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function membershipData(groupId: string, userId: string) {
  return {
    groupId,
    userId,
    role: 'owner',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

function groupRef(firestore: Firestore, groupId: string) {
  return doc(firestore, 'financialGroups', groupId)
}

function membershipRef(firestore: Firestore, groupId: string, userId: string) {
  return doc(firestore, 'financialGroups', groupId, 'members', userId)
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'finance-app-dev-23ac7',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile('firestore.rules', 'utf8'),
    },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
})

afterAll(async () => {
  await environment.cleanup()
})

async function seedProfile(uid: string) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid), {
      email: 'pessoa@example.com',
      displayName: null,
      photoURL: null,
      createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
    })
  })
}

async function seedPersonalGroup(
  groupId: string,
  userId: string,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore()
    const createdAt = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'))
    await setDoc(groupRef(firestore, groupId), {
      name: 'Meu Financeiro',
      type: 'personal',
      currency: 'BRL',
      ownerId: userId,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    })
    await setDoc(membershipRef(firestore, groupId, userId), {
      groupId,
      userId,
      role: 'owner',
      status: 'active',
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    })
  })
}

describe('Firestore Rules de users/{uid}', () => {
  it('permite leitura própria e bloqueia leitura alheia ou anônima', async () => {
    await seedProfile('user-1')
    await assertSucceeds(
      getDoc(
        doc(
          environment.authenticatedContext('user-1').firestore(),
          'users',
          'user-1',
        ),
      ),
    )
    await assertFails(
      getDoc(
        doc(
          environment.authenticatedContext('user-2').firestore(),
          'users',
          'user-1',
        ),
      ),
    )
    await assertFails(
      getDoc(
        doc(
          environment.unauthenticatedContext().firestore(),
          'users',
          'user-1',
        ),
      ),
    )
  })

  it('valida contrato, timestamps e imutabilidade do perfil', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()
    const profile = doc(firestore, 'users', 'user-1')
    await assertSucceeds(setDoc(profile, validProfile))
    await assertFails(setDoc(doc(firestore, 'users', 'user-2'), validProfile))
    await assertFails(
      updateDoc(profile, {
        createdAt: Timestamp.fromDate(new Date('2030-01-01T00:00:00Z')),
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(profile, { extra: true, updatedAt: serverTimestamp() }),
    )
    await assertFails(deleteDoc(profile))
  })
})

describe('Firestore Rules do bootstrap pessoal', () => {
  it('permite criar grupo e owner atômicos para o próprio UID', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()
    const batch = writeBatch(firestore)
    batch.set(groupRef(firestore, 'user-1'), groupData('user-1'))
    batch.set(
      membershipRef(firestore, 'user-1', 'user-1'),
      membershipData('user-1', 'user-1'),
    )
    await assertSucceeds(batch.commit())
  })

  it('bloqueia grupo parcial, owner diferente e contrato inválido', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()
    await assertFails(
      setDoc(groupRef(firestore, 'user-1'), groupData('user-1')),
    )

    const wrongOwner = writeBatch(firestore)
    wrongOwner.set(groupRef(firestore, 'user-1'), groupData('user-2'))
    wrongOwner.set(
      membershipRef(firestore, 'user-1', 'user-1'),
      membershipData('user-1', 'user-1'),
    )
    await assertFails(wrongOwner.commit())

    const invalid = writeBatch(firestore)
    invalid.set(groupRef(firestore, 'user-1'), {
      ...groupData('user-1'),
      currency: 'USD',
    })
    invalid.set(
      membershipRef(firestore, 'user-1', 'user-1'),
      membershipData('user-1', 'user-1'),
    )
    await assertFails(invalid.commit())
  })

  it('bloqueia membership de outro usuário, outro papel e grupo inexistente', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()
    await seedPersonalGroup('user-1', 'user-1')

    await assertFails(
      setDoc(
        membershipRef(firestore, 'user-1', 'user-2'),
        membershipData('user-1', 'user-2'),
      ),
    )
    await assertFails(
      setDoc(membershipRef(firestore, 'user-1', 'user-1'), {
        ...membershipData('user-1', 'user-1'),
        role: 'admin',
      }),
    )
    await assertFails(
      setDoc(
        membershipRef(firestore, 'missing', 'user-1'),
        membershipData('missing', 'user-1'),
      ),
    )
  })

  it('isola leitura e bloqueia update/delete de grupo e membership', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const owner = environment.authenticatedContext('user-1').firestore()
    const outsider = environment.authenticatedContext('user-2').firestore()

    await assertSucceeds(getDoc(groupRef(owner, 'group-a')))
    await assertSucceeds(getDoc(membershipRef(owner, 'group-a', 'user-1')))
    await assertFails(getDoc(groupRef(outsider, 'group-a')))
    await assertFails(getDoc(membershipRef(outsider, 'group-a', 'user-1')))
    await assertFails(
      updateDoc(groupRef(owner, 'group-a'), {
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(deleteDoc(groupRef(owner, 'group-a')))
    await assertFails(
      updateDoc(membershipRef(owner, 'group-a', 'user-1'), {
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(deleteDoc(membershipRef(owner, 'group-a', 'user-1')))
  })
})

describe('Firestore Rules de activeGroupId', () => {
  it('permite grupo explícito com membership owner ativa', async () => {
    await seedProfile('user-1')
    await seedPersonalGroup('group-explicit', 'user-1')
    const profile = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )
    await assertSucceeds(
      updateDoc(profile, {
        activeGroupId: 'group-explicit',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('bloqueia grupo inexistente, sem membership, alheio ou inativo', async () => {
    await seedProfile('user-1')
    await seedPersonalGroup('group-other', 'user-2')
    await seedPersonalGroup('group-inactive', 'user-1', {
      status: 'inactive',
    })
    await seedPersonalGroup('group-wrong-role', 'user-1', {
      role: 'viewer',
    })
    const profile = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )
    for (const activeGroupId of [
      'missing',
      'group-other',
      'group-inactive',
      'group-wrong-role',
    ]) {
      await assertFails(
        updateDoc(profile, {
          activeGroupId,
          updatedAt: serverTimestamp(),
        }),
      )
    }
  })
})
