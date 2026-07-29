import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './Button'
import { EmptyState, ErrorState, LoadingState } from './AppState'

describe('estados de interface', () => {
  it('expõe o carregamento como status', () => {
    render(<LoadingState title="Preparando conteúdo" />)

    expect(screen.getByRole('status')).toHaveTextContent('Preparando conteúdo')
  })

  it('renderiza uma ação opcional no estado vazio', () => {
    render(
      <EmptyState
        action={<Button>Adicionar item</Button>}
        description="Ainda não há itens."
        title="Lista vazia"
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Adicionar item' }),
    ).toBeInTheDocument()
  })

  it('executa a tentativa novamente no estado de erro', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(
      <ErrorState
        description="Tente novamente em alguns instantes."
        onRetry={onRetry}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
