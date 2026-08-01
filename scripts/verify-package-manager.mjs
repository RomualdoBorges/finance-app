import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const competingLockfiles = new Set([
  'bun.lock',
  'bun.lockb',
  'npm-shrinkwrap.json',
  'package-lock.json',
  'yarn.lock',
])
const ignoredDirectories = new Set(['.git', 'node_modules'])

function listInvalidLockfiles(directory, repositoryRoot = directory) {
  const invalidLockfiles = []

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        invalidLockfiles.push(
          ...listInvalidLockfiles(join(directory, entry.name), repositoryRoot),
        )
      }
      continue
    }

    const filePath = join(directory, entry.name)
    const isNestedPnpmLockfile =
      entry.name === 'pnpm-lock.yaml' && directory !== repositoryRoot

    if (competingLockfiles.has(entry.name) || isNestedPnpmLockfile) {
      invalidLockfiles.push(relative(repositoryRoot, filePath))
    }
  }

  return invalidLockfiles
}

export function verifyRepository(repositoryRoot) {
  const packageJsonPath = join(repositoryRoot, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const packageManager = packageJson.packageManager

  if (!/^pnpm@\d+\.\d+\.\d+$/.test(packageManager ?? '')) {
    throw new Error(
      'O package.json raiz deve declarar uma versão exata em "packageManager": "pnpm@X.Y.Z".',
    )
  }

  if (!existsSync(join(repositoryRoot, 'pnpm-lock.yaml'))) {
    throw new Error('O pnpm-lock.yaml raiz é obrigatório.')
  }

  const invalidLockfiles = listInvalidLockfiles(repositoryRoot)

  if (invalidLockfiles.length > 0) {
    throw new Error(
      `Lockfile(s) não permitido(s): ${invalidLockfiles.join(', ')}. ` +
        'Mantenha somente o pnpm-lock.yaml da raiz.',
    )
  }
}

export function verifyPnpmUserAgent(userAgent) {
  if (!userAgent?.startsWith('pnpm/')) {
    throw new Error(
      'Gerenciador não permitido. Use pnpm install; npm, yarn e bun são rejeitados.',
    )
  }
}

function main() {
  const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)))

  if (process.argv.includes('--require-pnpm')) {
    verifyPnpmUserAgent(process.env.npm_config_user_agent)
  }

  verifyRepository(repositoryRoot)
  console.log(
    'Verificação do gerenciador de pacotes concluída: pnpm exclusivo.',
  )
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])

if (isDirectExecution) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
