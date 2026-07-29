import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { AuthenticatedUser } from '../domain/AuthenticatedUser'
import { AuthError } from '../domain/AuthError'
import { AuthService } from '../services/AuthService'
import { AuthProvider } from '../../../providers/AuthProvider'
import { PublicOnlyGuard } from '../../../routes/guards/PublicOnlyGuard'
import { routePaths } from '../../../routes/paths'
import { createAuthRepositoryMock } from '../../../test/mocks/repositories/authRepositoryMock'
import { renderWithProviders } from '../../../test/render'
import { LoginPage } from './LoginPage'
import { RegisterPage } from './RegisterPage'

const authenticatedUser: AuthenticatedUser = {
  uid: 'user-1',
  email: 'pessoa@example.com',
  displayName: null,
  photoURL: null,
  emailVerified: false,
}

function renderAuthPages(
  initialEntry: string = routePaths.login,
  configure?: (repository: ReturnType<typeof createAuthRepositoryMock>) => void,
) {
  const repository = createAuthRepositoryMock()
  let listener: ((user: AuthenticatedUser | null) => void) | undefined
  repository.subscribeToAuthState.mockImplementation((nextListener) => {
    listener = nextListener
    nextListener(null)
    return vi.fn()
  })
  configure?.(repository)

  return {
    repository,
    ...renderWithProviders(
      <AuthProvider service={new AuthService(repository)}>
        <Routes>
          <Route element={<PublicOnlyGuard />}>
            <Route path={routePaths.login} element={<LoginPage />} />
            <Route path={routePaths.register} element={<RegisterPage />} />
          </Route>
          <Route
            path={routePaths.home}
            element={<h1>Página inicial protegida</h1>}
          />
        </Routes>
      </AuthProvider>,
      { initialEntries: [initialEntry] },
    ),
    authenticate() {
      listener?.(authenticatedUser)
    },
  }
}

async function fillLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('E-mail'), 'pessoa@example.com')
  await user.type(screen.getByLabelText('Senha'), 'segredo')
}

describe('páginas de autenticação', () => {
  it('renderiza os campos e botão de login', () => {
    renderAuthPages()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('renderiza a confirmação de senha no cadastro', () => {
    renderAuthPages(routePaths.register)
    expect(screen.getByLabelText('Confirme a senha')).toBeInTheDocument()
  })

  it('navega entre login e cadastro', async () => {
    const user = userEvent.setup()
    renderAuthPages()
    await user.click(screen.getByRole('link', { name: 'Cadastre-se' }))
    expect(
      screen.getByRole('heading', { name: 'Crie sua conta' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Entrar' }))
    expect(
      screen.getByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeInTheDocument()
  })

  it('exibe erros e foca o primeiro campo inválido', async () => {
    const user = userEvent.setup()
    renderAuthPages()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Informe seu e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe sua senha.')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
  })

  it('mantém o botão desabilitado durante o login', async () => {
    const user = userEvent.setup()
    renderAuthPages(undefined, (repository) => {
      repository.signInWithEmailAndPassword.mockReturnValue(
        new Promise(() => undefined),
      )
    })
    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled()
  })

  it('navega após login quando a sessão autenticada é observada', async () => {
    const user = userEvent.setup()
    const page = renderAuthPages(undefined, (repository) => {
      repository.signInWithEmailAndPassword.mockResolvedValue(authenticatedUser)
    })
    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    page.authenticate()
    expect(
      await screen.findByRole('heading', {
        name: 'Página inicial protegida',
      }),
    ).toBeInTheDocument()
  })

  it('navega após cadastro quando a sessão autenticada é observada', async () => {
    const user = userEvent.setup()
    const page = renderAuthPages(routePaths.register, (repository) => {
      repository.registerWithEmailAndPassword.mockResolvedValue(
        authenticatedUser,
      )
    })
    await user.type(screen.getByLabelText('E-mail'), 'pessoa@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo')
    await user.type(screen.getByLabelText('Confirme a senha'), 'segredo')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))
    page.authenticate()
    expect(
      await screen.findByRole('heading', {
        name: 'Página inicial protegida',
      }),
    ).toBeInTheDocument()
  })

  it('exibe erro de autenticação sanitizado', async () => {
    const user = userEvent.setup()
    renderAuthPages(undefined, (repository) => {
      repository.signInWithEmailAndPassword.mockRejectedValue(
        new AuthError('invalid-credentials'),
      )
    })
    await fillLogin(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha inválidos.',
    )
  })

  it('mostra e oculta a senha sem alterar seu valor', async () => {
    const user = userEvent.setup()
    renderAuthPages()
    const password = screen.getByLabelText('Senha')
    await user.type(password, 'segredo')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(password).toHaveValue('segredo')
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
