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
