import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

function categoryRef(
  firestore: Firestore,
  groupId: string,
  categoryId: string,
) {
  return doc(firestore, 'financialGroups', groupId, 'categories', categoryId)
}

function categoryData(
  groupId: string,
  userId: string,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    groupId,
    name: 'Moradia',
    normalizedName: 'moradia',
    type: 'expense',
    origin: 'default',
    status: 'active',
    parentCategoryId: null,
    icon: 'house',
    usageCount: 0,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  }
}

function accountRef(firestore: Firestore, groupId: string, accountId: string) {
  return doc(firestore, 'financialGroups', groupId, 'accounts', accountId)
}

function accountData(
  groupId: string,
  userId: string,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    groupId,
    name: 'Conta principal',
    normalizedName: 'conta principal',
    description: null,
    institutionName: 'Banco',
    icon: null,
    color: '#2563eb',
    accountType: 'checking',
    includeInBalance: true,
    includeInNetWorth: true,
    initialBalanceMinor: 0,
    initialBalanceDate: '2026-07-31',
    status: 'active',
    isArchived: false,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  }
}

function transactionRef(
  firestore: Firestore,
  groupId: string,
  transactionId: string,
) {
  return doc(
    firestore,
    'financialGroups',
    groupId,
    'transactions',
    transactionId,
  )
}

function transactionData(
  groupId: string,
  userId: string,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    groupId,
    type: 'expense',
    description: 'Mercado',
    normalizedDescription: 'mercado',
    amountMinor: 15050,
    accountId: 'account-1',
    categoryId: 'category-1',
    notes: null,
    status: 'pending',
    competenceDate: '2026-07-31',
    dueDate: '2026-08-05',
    paymentDate: '2026-08-05',
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  }
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

async function seedProfile(
  uid: string,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid), {
      email: 'pessoa@example.com',
      displayName: null,
      photoURL: null,
      createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      updatedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      ...overrides,
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
  it('permite sincronizar campos básicos preservando activeGroupId legado', async () => {
    await seedProfile('user-1', { activeGroupId: 'user-1' })
    const firestore = environment.authenticatedContext('user-1').firestore()
    const profile = doc(firestore, 'users', 'user-1')

    await assertSucceeds(
      updateDoc(profile, {
        email: 'novo@example.com',
        displayName: 'Pessoa Atualizada',
        photoURL: 'https://example.com/avatar.png',
        updatedAt: serverTimestamp(),
      }),
    )

    const snapshot = await getDoc(profile)
    if (snapshot.data()?.['activeGroupId'] !== 'user-1') {
      throw new Error('activeGroupId legado não foi preservado')
    }
  })

  it('não permite trocar nem remover activeGroupId legado inválido', async () => {
    await seedProfile('user-1', { activeGroupId: 'user-1' })
    const profile = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )

    await assertFails(
      updateDoc(profile, {
        activeGroupId: 'missing',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      setDoc(
        profile,
        {
          email: 'pessoa@example.com',
          displayName: null,
          photoURL: null,
          createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
          updatedAt: serverTimestamp(),
        },
        { merge: false },
      ),
    )
  })

  it('bloqueia activeGroupId inválido na criação de perfil', async () => {
    const firestore = environment.authenticatedContext('user-1').firestore()
    await assertFails(
      setDoc(doc(firestore, 'users', 'user-1'), {
        ...validProfile,
        activeGroupId: 'missing',
      }),
    )
  })

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

  it('mantém campos extras, createdAt e perfil alheio bloqueados', async () => {
    await seedProfile('user-1', { activeGroupId: 'legacy-group' })
    const ownerProfile = doc(
      environment.authenticatedContext('user-1').firestore(),
      'users',
      'user-1',
    )
    const otherProfile = doc(
      environment.authenticatedContext('user-2').firestore(),
      'users',
      'user-1',
    )

    await assertFails(
      updateDoc(ownerProfile, {
        extra: true,
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(ownerProfile, {
        createdAt: Timestamp.fromDate(new Date('2030-01-01T00:00:00Z')),
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(otherProfile, {
        displayName: 'Invasor',
        updatedAt: serverTimestamp(),
      }),
    )
  })
})

describe('Firestore Rules de categorias', () => {
  it('permite ao membro ativo listar e criar raiz e filha no mesmo batch', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    const batch = writeBatch(firestore)
    batch.set(
      categoryRef(firestore, 'group-a', 'expense-housing'),
      categoryData('group-a', 'user-1'),
    )
    batch.set(
      categoryRef(firestore, 'group-a', 'expense-housing-rent'),
      categoryData('group-a', 'user-1', {
        name: 'Aluguel',
        normalizedName: 'aluguel',
        parentCategoryId: 'expense-housing',
        icon: null,
      }),
    )
    await assertSucceeds(batch.commit())
    await assertSucceeds(
      getDocs(collection(firestore, 'financialGroups/group-a/categories')),
    )
  })

  it('permite categoria personalizada com contrato exato', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    await assertSucceeds(
      setDoc(
        categoryRef(firestore, 'group-a', 'custom-pets'),
        categoryData('group-a', 'user-1', {
          name: 'Pets',
          normalizedName: 'pets',
          origin: 'custom',
          icon: null,
        }),
      ),
    )
  })

  it('bloqueia anônimo, usuário externo e identidade de outro grupo', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const anonymous = environment.unauthenticatedContext().firestore()
    const outsider = environment.authenticatedContext('user-2').firestore()
    const owner = environment.authenticatedContext('user-1').firestore()

    await assertFails(
      getDocs(collection(anonymous, 'financialGroups/group-a/categories')),
    )
    await assertFails(
      getDocs(collection(outsider, 'financialGroups/group-a/categories')),
    )
    await assertFails(
      setDoc(
        categoryRef(owner, 'group-a', 'wrong-group'),
        categoryData('group-b', 'user-1'),
      ),
    )
  })

  it('bloqueia campos extras, timestamps locais e createdBy divergente', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    const invalidCases = [
      categoryData('group-a', 'user-1', { extra: true }),
      categoryData('group-a', 'user-1', {
        createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      }),
      categoryData('group-a', 'user-2'),
      categoryData('group-a', 'user-1', { status: 'archived' }),
    ]
    for (const [index, invalidData] of invalidCases.entries()) {
      await assertFails(
        setDoc(
          categoryRef(firestore, 'group-a', `invalid-${index}`),
          invalidData,
        ),
      )
    }
  })

  it('bloqueia pai ausente, pai de outro tipo e profundidade maior que um', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    await setDoc(
      categoryRef(firestore, 'group-a', 'expense-root'),
      categoryData('group-a', 'user-1'),
    )
    await setDoc(
      categoryRef(firestore, 'group-a', 'expense-child'),
      categoryData('group-a', 'user-1', {
        name: 'Aluguel',
        normalizedName: 'aluguel',
        parentCategoryId: 'expense-root',
      }),
    )

    for (const [id, overrides] of [
      ['missing-parent', { parentCategoryId: 'missing' }],
      ['wrong-type', { parentCategoryId: 'expense-root', type: 'income' }],
      ['grandchild', { parentCategoryId: 'expense-child' }],
    ] as const) {
      await assertFails(
        setDoc(
          categoryRef(firestore, 'group-a', id),
          categoryData('group-a', 'user-1', overrides),
        ),
      )
    }
  })

  it('permite editar campos personalizáveis e preserva campos protegidos', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    const reference = categoryRef(firestore, 'group-a', 'expense-root')
    await setDoc(reference, categoryData('group-a', 'user-1'))
    await assertSucceeds(
      updateDoc(reference, {
        name: 'Casa',
        normalizedName: 'casa',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(reference, {
        type: 'income',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(reference, {
        createdBy: 'user-2',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('permite arquivar em batch, bloqueia restauração com pai arquivado e depois restaura', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    const root = categoryRef(firestore, 'group-a', 'root')
    const child = categoryRef(firestore, 'group-a', 'child')
    const creation = writeBatch(firestore)
    creation.set(root, categoryData('group-a', 'user-1'))
    creation.set(
      child,
      categoryData('group-a', 'user-1', {
        name: 'Aluguel',
        normalizedName: 'aluguel',
        parentCategoryId: 'root',
      }),
    )
    await creation.commit()

    const archive = writeBatch(firestore)
    archive.update(root, { status: 'archived', updatedAt: serverTimestamp() })
    archive.update(child, { status: 'archived', updatedAt: serverTimestamp() })
    await assertSucceeds(archive.commit())
    await assertFails(
      updateDoc(child, { status: 'active', updatedAt: serverTimestamp() }),
    )
    await assertSucceeds(
      updateDoc(root, { status: 'active', updatedAt: serverTimestamp() }),
    )
    await assertSucceeds(
      updateDoc(child, { status: 'active', updatedAt: serverTimestamp() }),
    )
  })

  it('exclui somente categoria personalizada não usada', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    const custom = categoryRef(firestore, 'group-a', 'custom')
    const defaultCategory = categoryRef(firestore, 'group-a', 'default')
    const root = categoryRef(firestore, 'group-a', 'root')
    await setDoc(root, categoryData('group-a', 'user-1'))
    await setDoc(
      custom,
      categoryData('group-a', 'user-1', {
        origin: 'custom',
        parentCategoryId: 'root',
      }),
    )
    await setDoc(defaultCategory, categoryData('group-a', 'user-1'))
    await assertSucceeds(deleteDoc(custom))
    await assertFails(deleteDoc(defaultCategory))

    const used = categoryRef(firestore, 'group-a', 'used')
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(categoryRef(context.firestore(), 'group-a', 'used'), {
        ...categoryData('group-a', 'user-1', {
          origin: 'custom',
          usageCount: 1,
          parentCategoryId: 'root',
        }),
        createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      })
    })
    await assertFails(deleteDoc(used))
  })
})

describe('Firestore Rules de contas', () => {
  it('permite membro ativo criar, ler, editar, arquivar e restaurar', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const firestore = environment.authenticatedContext('user-1').firestore()
    const reference = accountRef(firestore, 'group-a', 'account-1')
    await assertSucceeds(setDoc(reference, accountData('group-a', 'user-1')))
    await assertSucceeds(getDoc(reference))
    await assertSucceeds(
      updateDoc(reference, {
        name: 'Nova conta',
        normalizedName: 'nova conta',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      updateDoc(reference, {
        status: 'archived',
        isArchived: true,
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      updateDoc(reference, {
        status: 'active',
        isArchived: false,
        updatedAt: serverTimestamp(),
      }),
    )
    const restored = await getDoc(reference)
    expect(restored.data()).toMatchObject({
      initialBalanceMinor: 0,
      initialBalanceDate: '2026-07-31',
    })
  })

  it('bloqueia acesso externo, identidade/path divergentes, timestamp local e campos extras', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const owner = environment.authenticatedContext('user-1').firestore()
    const outsider = environment.authenticatedContext('user-2').firestore()
    await assertFails(
      getDocs(collection(outsider, 'financialGroups/group-a/accounts')),
    )
    const invalid = [
      accountData('group-b', 'user-1'),
      accountData('group-a', 'user-2'),
      accountData('group-a', 'user-1', { currentBalance: 0 }),
      accountData('group-a', 'user-1', { createdAt: Timestamp.now() }),
      accountData('group-a', 'user-1', {
        status: 'archived',
        isArchived: false,
      }),
      accountData('group-a', 'user-1', { accountType: 'payment' }),
      accountData('group-a', 'user-1', { includeInBalance: 'yes' }),
      accountData('group-a', 'user-1', { includeInNetWorth: 1 }),
      accountData('group-a', 'user-1', { projectedBalance: 0 }),
      accountData('group-a', 'user-1', { currentBalanceMinor: 0 }),
      accountData('group-a', 'user-1', {
        currentBalanceMinor: 0,
        projectedBalanceMinor: 0,
        balancesUpdatedAt: serverTimestamp(),
      }),
      accountData('group-a', 'user-1', { initialBalanceMinor: 1.5 }),
      accountData('group-a', 'user-1', { initialBalanceMinor: 9000000000001 }),
      accountData('group-a', 'user-1', { initialBalanceDate: '31/07/2026' }),
      accountData('group-a', 'user-1', { initialBalanceDate: '2026-13-01' }),
    ]
    const missingFlag = accountData('group-a', 'user-1') as Record<
      string,
      unknown
    >
    delete missingFlag.includeInBalance
    invalid.push(missingFlag)
    for (const [index, value] of invalid.entries()) {
      await assertFails(
        setDoc(accountRef(owner, 'group-a', `invalid-${index}`), value),
      )
    }
  })

  it('lê documento legado e permite atualizá-lo somente para o contrato novo', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const owner = environment.authenticatedContext('user-1').firestore()
    const reference = accountRef(owner, 'group-a', 'legacy')
    await environment.withSecurityRulesDisabled(async (context) => {
      const legacy = accountData('group-a', 'user-1') as Record<string, unknown>
      delete legacy.accountType
      delete legacy.includeInBalance
      delete legacy.includeInNetWorth
      delete legacy.initialBalanceMinor
      delete legacy.initialBalanceDate
      await setDoc(accountRef(context.firestore(), 'group-a', 'legacy'), {
        ...legacy,
        createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      })
    })
    await assertSucceeds(getDoc(reference))
    await assertFails(
      updateDoc(reference, {
        name: 'Ainda legado',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      updateDoc(reference, {
        accountType: 'other',
        includeInBalance: true,
        includeInNetWorth: true,
        initialBalanceMinor: 0,
        initialBalanceDate: '2026-07-31',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('preserva campos protegidos e bloqueia delete físico e escrita de outro grupo', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    await seedPersonalGroup('group-b', 'user-2')
    const owner = environment.authenticatedContext('user-1').firestore()
    const reference = accountRef(owner, 'group-a', 'account-1')
    await setDoc(reference, accountData('group-a', 'user-1'))
    for (const change of [
      { groupId: 'group-b', updatedAt: serverTimestamp() },
      { createdBy: 'user-2', updatedAt: serverTimestamp() },
      { createdAt: Timestamp.fromMillis(0), updatedAt: serverTimestamp() },
    ])
      await assertFails(updateDoc(reference, change))
    await assertFails(deleteDoc(reference))
    await assertFails(
      setDoc(
        accountRef(owner, 'group-b', 'foreign'),
        accountData('group-b', 'user-1'),
      ),
    )
  })

  it('preserva o trio consolidado em edição, archive e restore e bloqueia sua escrita', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const owner = environment.authenticatedContext('user-1').firestore()
    const reference = accountRef(owner, 'group-a', 'consolidated')
    const consolidatedAt = Timestamp.fromDate(new Date('2026-07-31T12:00:00Z'))
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(accountRef(context.firestore(), 'group-a', 'consolidated'), {
        ...accountData('group-a', 'user-1'),
        currentBalanceMinor: 12500,
        projectedBalanceMinor: 15000,
        balancesUpdatedAt: consolidatedAt,
        createdAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
        updatedAt: Timestamp.fromDate(new Date('2026-01-01T00:00:00Z')),
      })
    })

    await assertSucceeds(
      updateDoc(reference, {
        name: 'Conta consolidada',
        normalizedName: 'conta consolidada',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      updateDoc(reference, {
        status: 'archived',
        isArchived: true,
        updatedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      updateDoc(reference, {
        status: 'active',
        isArchived: false,
        updatedAt: serverTimestamp(),
      }),
    )

    for (const change of [
      { currentBalanceMinor: 13000, updatedAt: serverTimestamp() },
      { projectedBalanceMinor: 16000, updatedAt: serverTimestamp() },
      { balancesUpdatedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    ])
      await assertFails(updateDoc(reference, change))

    const snapshot = await getDoc(reference)
    expect(snapshot.data()).toMatchObject({
      currentBalanceMinor: 12500,
      projectedBalanceMinor: 15000,
      balancesUpdatedAt: consolidatedAt,
    })

    const withoutConsolidated = accountData('group-a', 'user-1', {
      name: 'Sobrescrita',
      normalizedName: 'sobrescrita',
    })
    await assertFails(setDoc(reference, withoutConsolidated))
  })

  it('bloqueia update quando o trio consolidado persistido é parcial ou inválido', async () => {
    await seedPersonalGroup('group-a', 'user-1')
    const owner = environment.authenticatedContext('user-1').firestore()
    for (const [id, consolidated] of [
      ['partial', { currentBalanceMinor: 0 }],
      [
        'invalid',
        {
          currentBalanceMinor: 0,
          projectedBalanceMinor: 1.5,
          balancesUpdatedAt: Timestamp.fromMillis(0),
        },
      ],
    ] as const) {
      await environment.withSecurityRulesDisabled(async (context) => {
        await setDoc(accountRef(context.firestore(), 'group-a', id), {
          ...accountData('group-a', 'user-1'),
          ...consolidated,
          createdAt: Timestamp.fromMillis(0),
          updatedAt: Timestamp.fromMillis(0),
        })
      })
      await assertFails(
        updateDoc(accountRef(owner, 'group-a', id), {
          name: 'Tentativa',
          normalizedName: 'tentativa',
          updatedAt: serverTimestamp(),
        }),
      )
    }
  })
})

describe('Firestore Rules de lançamentos', () => {
  async function seedReferences() {
    await seedPersonalGroup('group-a', 'user-1')
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        accountRef(context.firestore(), 'group-a', 'account-1'),
        accountData('group-a', 'user-1', {
          createdAt: Timestamp.fromMillis(0),
          updatedAt: Timestamp.fromMillis(0),
        }),
      )
      await setDoc(
        categoryRef(context.firestore(), 'group-a', 'category-1'),
        categoryData('group-a', 'user-1', {
          createdAt: Timestamp.fromMillis(0),
          updatedAt: Timestamp.fromMillis(0),
        }),
      )
    })
  }

  it('permite ao membro criar e ler receita e despesa válidas', async () => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    await assertSucceeds(
      setDoc(
        transactionRef(owner, 'group-a', 'expense-1'),
        transactionData('group-a', 'user-1'),
      ),
    )
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        categoryRef(context.firestore(), 'group-a', 'income-1'),
        categoryData('group-a', 'user-1', {
          type: 'income',
          createdAt: Timestamp.fromMillis(0),
          updatedAt: Timestamp.fromMillis(0),
        }),
      )
    })
    await assertSucceeds(
      setDoc(
        transactionRef(owner, 'group-a', 'income-1'),
        transactionData('group-a', 'user-1', {
          type: 'income',
          categoryId: 'income-1',
        }),
      ),
    )
    await assertSucceeds(
      getDocs(collection(owner, 'financialGroups', 'group-a', 'transactions')),
    )
  })

  it.each(['planned', 'pending', 'confirmed'])(
    'permite criar lançamento %s',
    async (status) => {
      await seedReferences()
      const owner = environment.authenticatedContext('user-1').firestore()
      await assertSucceeds(
        setDoc(
          transactionRef(owner, 'group-a', `status-${status}`),
          transactionData('group-a', 'user-1', { status }),
        ),
      )
    },
  )

  it('bloqueia status ausente em nova criação', async () => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    const data = transactionData('group-a', 'user-1') as Record<string, unknown>
    delete data.status
    await assertFails(
      setDoc(transactionRef(owner, 'group-a', 'no-status'), data),
    )
  })

  it.each([
    { type: 'transfer' },
    { amountMinor: 0 },
    { amountMinor: -1 },
    { amountMinor: 1.5 },
    { amountMinor: 9000000000001 },
    { groupId: 'group-b' },
    { createdBy: 'user-2' },
    { status: 'canceled' },
    { status: 'overdue' },
    { status: 'invalid' },
    { confirmedAt: serverTimestamp() },
    { canceledAt: serverTimestamp() },
    { competenceDate: '31/07/2026' },
    { dueDate: '2026-13-01' },
    { paymentDate: Timestamp.fromMillis(0) },
    { competenceDate: null },
  ])('bloqueia payload inválido %#', async (override) => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    await assertFails(
      setDoc(
        transactionRef(owner, 'group-a', crypto.randomUUID()),
        transactionData('group-a', 'user-1', override),
      ),
    )
  })

  it('bloqueia ausência de qualquer data em nova criação', async () => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    for (const field of ['competenceDate', 'dueDate', 'paymentDate']) {
      const data = transactionData('group-a', 'user-1') as Record<
        string,
        unknown
      >
      delete data[field]
      await assertFails(
        setDoc(transactionRef(owner, 'group-a', crypto.randomUUID()), data),
      )
    }
  })

  it('mantém documento legado sem datas legível', async () => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    const reference = transactionRef(owner, 'group-a', 'legacy')
    await environment.withSecurityRulesDisabled(async (context) => {
      const data = transactionData('group-a', 'user-1') as Record<
        string,
        unknown
      >
      delete data.competenceDate
      delete data.dueDate
      delete data.paymentDate
      delete data.status
      await setDoc(transactionRef(context.firestore(), 'group-a', 'legacy'), {
        ...data,
        createdAt: Timestamp.fromMillis(0),
        updatedAt: Timestamp.fromMillis(0),
      })
    })
    await assertSucceeds(getDoc(reference))
  })

  it('bloqueia referências ausentes, arquivadas, incompatíveis e outro usuário', async () => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    for (const override of [
      { accountId: 'missing' },
      { categoryId: 'missing' },
      { type: 'income' },
    ])
      await assertFails(
        setDoc(
          transactionRef(owner, 'group-a', crypto.randomUUID()),
          transactionData('group-a', 'user-1', override),
        ),
      )
    const stranger = environment.authenticatedContext('user-2').firestore()
    await assertFails(getDoc(transactionRef(stranger, 'group-a', 'anything')))
    await assertFails(
      setDoc(
        transactionRef(stranger, 'group-a', 'foreign'),
        transactionData('group-a', 'user-2'),
      ),
    )
  })

  it('bloqueia update e delete', async () => {
    await seedReferences()
    const owner = environment.authenticatedContext('user-1').firestore()
    const reference = transactionRef(owner, 'group-a', 'expense-1')
    await assertSucceeds(
      setDoc(reference, transactionData('group-a', 'user-1')),
    )
    await assertFails(
      updateDoc(reference, {
        description: 'Alterada',
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(deleteDoc(reference))
  })
})
