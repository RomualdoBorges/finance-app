import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../providers/AuthContext'
import { renderWithProviders } from '../test/render'
import { AppLayout } from './AppLayout'

function renderLayout() {
  return renderWithProviders(
    <AuthContext.Provider
      value={{
        status: 'authenticated',
        user: {
          uid: 'user-1',
          email: null,
          displayName: null,
          photoURL: null,
          emailVerified: false,
        },
        registerWithEmailAndPassword: () =>
          Promise.reject(new Error('não utilizado')),
        signInWithEmailAndPassword: () =>
          Promise.reject(new Error('não utilizado')),
        signOut: () => Promise.resolve(),
      }}
    >
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<h1>Conteúdo de teste</h1>} />
        </Route>
      </Routes>
    </AuthContext.Provider>,
  )
}

describe('AppLayout', () => {
  it('renderiza cabeçalho, navegação ativa e conteúdo', () => {
    renderLayout()

    expect(screen.getByRole('banner')).toHaveTextContent('Financeiro')
    expect(
      screen.getByRole('navigation', { name: 'Navegação principal' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('heading', { name: 'Conteúdo de teste' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Pular para o conteúdo' }),
    ).toHaveAttribute('href', '#conteudo-principal')
  })

  it('abre e fecha a navegação mobile pelos controles acessíveis', async () => {
    const user = userEvent.setup()
    renderLayout()

    const openButton = screen.getByRole('button', {
      name: 'Abrir navegação',
    })
    await user.click(openButton)

    expect(openButton).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('dialog', { name: 'Financeiro' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fechar navegação' }))

    expect(
      screen.queryByRole('dialog', { name: 'Financeiro' }),
    ).not.toBeInTheDocument()
    expect(openButton).toHaveFocus()
  })
})
