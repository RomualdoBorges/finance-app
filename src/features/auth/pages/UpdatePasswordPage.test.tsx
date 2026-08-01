import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import {
  AuthContext,
  type AuthContextValue,
} from '../../../providers/AuthContext'
import { renderWithProviders } from '../../../test/render'
import { AuthError } from '../domain/AuthError'
import { UpdatePasswordPage } from './UpdatePasswordPage'

function LocationView() {
  return <span data-testid="location">{useLocation().pathname}</span>
}

function renderPage(updatePassword: AuthContextValue['updatePassword']) {
  return renderWithProviders(
    <AuthContext.Provider
      value={{
        status: 'authenticated',
        user: {
          uid: 'user-1',
          email: 'pessoa@example.com',
          displayName: null,
          photoURL: null,
          emailVerified: true,
        },
        registerWithEmailAndPassword: vi.fn(),
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        sendPasswordResetEmail: vi.fn(),
        sendVerificationEmail: vi.fn(),
        reloadAuthenticatedUser: vi.fn(),
        updatePassword,
        deleteCurrentUser: vi.fn(),
      }}
    >
      <LocationView />
      <Routes>
        <Route path="/conta/alterar-senha" element={<UpdatePasswordPage />} />
        <Route path="/" element={<h1>Início</h1>} />
      </Routes>
    </AuthContext.Provider>,
    { initialEntries: ['/conta/alterar-senha'] },
  )
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Senha atual'), 'senha-atual')
  await user.type(screen.getByLabelText('Nova senha'), 'senha-nova')
  await user.type(screen.getByLabelText('Confirmar nova senha'), 'senha-nova')
}

describe('UpdatePasswordPage', () => {
  it('renderiza conteúdo, campos acessíveis e ação de voltar', () => {
    renderPage(vi.fn())

    expect(
      screen.getByRole('heading', { level: 1, name: 'Alterar senha' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute(
      'autocomplete',
      'current-password',
    )
    expect(screen.getByLabelText('Nova senha')).toHaveAttribute(
      'autocomplete',
      'new-password',
    )
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveAttribute(
      'autocomplete',
      'new-password',
    )
    expect(
      screen.getByRole('button', { name: 'Atualizar senha' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Voltar ao início' }),
    ).toHaveAttribute('href', '/')
  })

  it('valida campos vazios e foca a senha atual', async () => {
    const user = userEvent.setup()
    const updatePassword = vi.fn()
    renderPage(updatePassword)

    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))

    expect(screen.getByText('Informe sua senha atual.')).toBeInTheDocument()
    expect(screen.getByText('Informe a nova senha.')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveFocus()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('rejeita confirmação divergente e senha nova igual à atual', async () => {
    const user = userEvent.setup()
    const updatePassword = vi.fn()
    renderPage(updatePassword)

    await user.type(screen.getByLabelText('Senha atual'), 'senha-igual')
    await user.type(screen.getByLabelText('Nova senha'), 'senha-igual')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'diferente')
    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))

    expect(
      screen.getByText('A nova senha deve ser diferente da senha atual.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('A confirmação da senha não corresponde à nova senha.'),
    ).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('envia uma vez, mostra loading e limpa os campos após sucesso', async () => {
    const user = userEvent.setup()
    let resolveUpdate: (() => void) | undefined
    const updatePassword = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve
        }),
    )
    renderPage(updatePassword)
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))

    expect(updatePassword).toHaveBeenCalledOnce()
    expect(updatePassword).toHaveBeenCalledWith({
      currentPassword: 'senha-atual',
      newPassword: 'senha-nova',
    })
    expect(
      screen.getByRole('button', { name: 'Atualizando...' }),
    ).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Atualizando...' }))
    expect(updatePassword).toHaveBeenCalledOnce()

    resolveUpdate?.()

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Senha atualizada com sucesso.',
    )
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('')
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/conta/alterar-senha',
    )
  })

  it('mantém os campos, a sessão e permite tentar novamente após falha', async () => {
    const user = userEvent.setup()
    const updatePassword = vi
      .fn<AuthContextValue['updatePassword']>()
      .mockRejectedValueOnce(new AuthError('incorrect-current-password'))
      .mockResolvedValueOnce(undefined)
    renderPage(updatePassword)
    await fillValidForm(user)

    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A senha atual está incorreta.',
    )
    expect(screen.getByLabelText('Senha atual')).toHaveValue('senha-atual')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('senha-nova')
    expect(
      screen.getByRole('button', { name: 'Atualizar senha' }),
    ).toBeEnabled()
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/conta/alterar-senha',
    )

    await user.click(screen.getByRole('button', { name: 'Atualizar senha' }))
    await waitFor(() => expect(updatePassword).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Senha atualizada com sucesso.',
    )
  })

  it('mostra e oculta senhas sem submeter o formulário', async () => {
    const user = userEvent.setup()
    const updatePassword = vi.fn()
    renderPage(updatePassword)
    const currentPassword = screen.getByLabelText('Senha atual')
    await user.type(currentPassword, 'senha-atual')

    await user.click(
      screen.getAllByRole('button', { name: 'Mostrar senha' })[0]!,
    )
    expect(currentPassword).toHaveAttribute('type', 'text')
    expect(currentPassword).toHaveValue('senha-atual')
    expect(updatePassword).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(currentPassword).toHaveAttribute('type', 'password')
  })

  it('não oferece o formulário quando a sessão não possui e-mail', () => {
    renderWithProviders(
      <AuthContext.Provider
        value={{
          status: 'authenticated',
          user: {
            uid: 'user-1',
            email: null,
            displayName: null,
            photoURL: null,
            emailVerified: true,
          },
          registerWithEmailAndPassword: vi.fn(),
          signInWithEmailAndPassword: vi.fn(),
          signOut: vi.fn(),
          sendPasswordResetEmail: vi.fn(),
          sendVerificationEmail: vi.fn(),
          reloadAuthenticatedUser: vi.fn(),
          updatePassword: vi.fn(),
          deleteCurrentUser: vi.fn(),
        }}
      >
        <UpdatePasswordPage />
      </AuthContext.Provider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível atualizar a senha desta conta.',
    )
    expect(
      screen.queryByRole('button', { name: 'Atualizar senha' }),
    ).not.toBeInTheDocument()
  })
})
