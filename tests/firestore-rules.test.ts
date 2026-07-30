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
} from 'firebase/firestore'

let environment: RulesTestEnvironment

const validProfile = {
  email: 'pessoa@example.com',
  displayName: null,
  photoURL: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
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

async function seedPersonalGroup(uid: string) {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore()
    const createdAt = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'))
    await setDoc(doc(firestore, 'groups', uid), {
      name: 'Meu Financeiro',
      createdAt,
      updatedAt: createdAt,
    })
    await setDoc(doc(firestore, 'groupMembers', uid), {
      groupId: uid,
      userId: uid,
      role: 'OWNER',
      createdAt,
    })
  })
}

describe('Firestore Rules de users/{uid}', () => {
  it('permite leitura própria e bloqueia leitura alheia ou anônima', async () => {
    await seedProfile('user-1')
    const own = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )
    const other = doc(
      environment.authenticatedContext('user-2').firestore(),
      'users',
      'user-1',
    )
    const anonymous = doc(
      environment.unauthenticatedContext().firestore(),
      'users',
      'user-1',
    )

    await assertSucceeds(getDoc(own))
    await assertFails(getDoc(other))
    await assertFails(getDoc(anonymous))
  })

  it('permite criar somente o próprio documento válido, inclusive nulls', async () => {
    const own = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )
    const other = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-2',
    )

    await assertSucceeds(setDoc(own, validProfile))
    await assertFails(setDoc(other, validProfile))
  })

  it('bloqueia criação com campos extras, timestamps ausentes ou tipos inválidos', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()

    await assertFails(
      setDoc(doc(firestore, 'users', 'user-1'), {
        ...validProfile,
        extra: true,
      }),
    )
    await assertFails(
      setDoc(doc(firestore, 'users', 'user-1'), {
        email: null,
        displayName: null,
        photoURL: null,
      }),
    )
    await assertFails(
      setDoc(doc(firestore, 'users', 'user-1'), {
        ...validProfile,
        email: 123,
      }),
    )
  })

  it('permite atualizar dados próprios sem alterar createdAt', async () => {
    await seedProfile('user-1')
    const own = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )

    await assertSucceeds(
      updateDoc(own, {
        displayName: 'Pessoa',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(own, {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('bloqueia campo extra, atualização alheia e exclusão', async () => {
    await seedProfile('user-1')
    const own = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )
    const other = doc(
      environment.authenticatedContext('user-2').firestore(),
      'users',
      'user-1',
    )

    await assertFails(
      updateDoc(own, { extra: true, updatedAt: serverTimestamp() }),
    )
    await assertFails(
      updateDoc(other, {
        email: 'outra@example.com',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(deleteDoc(own))
  })
})

describe('Firestore Rules de grupo individual', () => {
  it('permite criar grupo e owner juntos somente para o próprio UID', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()
    const batch = writeBatch(firestore)
    batch.set(doc(firestore, 'groups', 'user-1'), {
      name: 'Meu Financeiro',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(firestore, 'groupMembers', 'user-1'), {
      groupId: 'user-1',
      userId: 'user-1',
      role: 'OWNER',
      createdAt: serverTimestamp(),
    })

    await assertSucceeds(batch.commit())

    const foreignBatch = writeBatch(firestore)
    foreignBatch.set(doc(firestore, 'groups', 'user-2'), {
      name: 'Meu Financeiro',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    foreignBatch.set(doc(firestore, 'groupMembers', 'user-2'), {
      groupId: 'user-2',
      userId: 'user-2',
      role: 'OWNER',
      createdAt: serverTimestamp(),
    })
    await assertFails(foreignBatch.commit())
  })

  it('bloqueia criação parcial, papel adicional e IDs não determinísticos', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()

    await assertFails(
      setDoc(doc(firestore, 'groups', 'user-1'), {
        name: 'Meu Financeiro',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )

    const batch = writeBatch(firestore)
    batch.set(doc(firestore, 'groups', 'user-1'), {
      name: 'Meu Financeiro',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(firestore, 'groupMembers', 'random-id'), {
      groupId: 'user-1',
      userId: 'user-1',
      role: 'MEMBER',
      createdAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })

  it('permite leitura somente ao owner e bloqueia mutação posterior', async () => {
    await seedPersonalGroup('user-1')
    const ownerFirestore = environment
      .authenticatedContext('user-1')
      .firestore()
    const outsiderFirestore = environment
      .authenticatedContext('user-2')
      .firestore()

    await assertSucceeds(getDoc(doc(ownerFirestore, 'groups', 'user-1')))
    await assertSucceeds(getDoc(doc(ownerFirestore, 'groupMembers', 'user-1')))
    await assertFails(getDoc(doc(outsiderFirestore, 'groups', 'user-1')))
    await assertFails(getDoc(doc(outsiderFirestore, 'groupMembers', 'user-1')))
    await assertFails(
      updateDoc(doc(ownerFirestore, 'groups', 'user-1'), {
        name: 'Outro nome',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(deleteDoc(doc(ownerFirestore, 'groupMembers', 'user-1')))
  })
})

describe('Firestore Rules de activeGroupId', () => {
  it('permite definir o próprio grupo quando o usuário é OWNER', async () => {
    await seedProfile('user-1')
    await seedPersonalGroup('user-1')
    const profile = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )

    await assertSucceeds(
      updateDoc(profile, {
        activeGroupId: 'user-1',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('bloqueia grupo inexistente e grupo de outro usuário', async () => {
    await seedProfile('user-1')
    await seedPersonalGroup('user-1')
    await seedPersonalGroup('user-2')
    const profile = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )

    await assertFails(
      updateDoc(profile, {
        activeGroupId: 'inexistente',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(profile, {
        activeGroupId: 'user-2',
        updatedAt: serverTimestamp(),
      }),
    )
  })
})
