import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  verifyPnpmUserAgent,
  verifyRepository,
} from './verify-package-manager.mjs'

function createRepository() {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'finance-app-pnpm-'))

  writeFileSync(
    join(repositoryRoot, 'package.json'),
    JSON.stringify({ packageManager: 'pnpm@11.7.0' }),
  )
  writeFileSync(
    join(repositoryRoot, 'pnpm-lock.yaml'),
    "lockfileVersion: '9.0'\n",
  )

  return repositoryRoot
}

test('aceita pnpm e o único lockfile na raiz', () => {
  const repositoryRoot = createRepository()

  try {
    assert.doesNotThrow(() => verifyPnpmUserAgent('pnpm/11.7.0 npm/? node/v22'))
    assert.doesNotThrow(() => verifyRepository(repositoryRoot))
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true })
  }
})

for (const manager of ['npm', 'yarn', 'bun']) {
  test(`rejeita instalação executada com ${manager}`, () => {
    assert.throws(
      () => verifyPnpmUserAgent(`${manager}/1.0.0 node/v22`),
      /Gerenciador não permitido/,
    )
  })
}

for (const lockfile of [
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'bun.lock',
  'bun.lockb',
]) {
  test(`rejeita ${lockfile}`, () => {
    const repositoryRoot = createRepository()

    try {
      writeFileSync(join(repositoryRoot, lockfile), '')
      assert.throws(() => verifyRepository(repositoryRoot), /Lockfile/)
    } finally {
      rmSync(repositoryRoot, { recursive: true, force: true })
    }
  })
}

test('rejeita pnpm-lock.yaml dentro de workspace', () => {
  const repositoryRoot = createRepository()

  try {
    mkdirSync(join(repositoryRoot, 'functions'))
    writeFileSync(join(repositoryRoot, 'functions', 'pnpm-lock.yaml'), '')
    assert.throws(() => verifyRepository(repositoryRoot), /functions/)
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true })
  }
})
