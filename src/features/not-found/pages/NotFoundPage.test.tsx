import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/render'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('permite voltar para a página inicial', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route path="/" element={<h1>Página inicial</h1>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>,
      { initialEntries: ['/endereco-inexistente'] },
    )

    await user.click(
      screen.getByRole('link', { name: 'Voltar para a página inicial' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Página inicial' }),
    ).toBeInTheDocument()
  })
})
