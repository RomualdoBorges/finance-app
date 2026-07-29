import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/render'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('apresenta a fundação sem dados financeiros fictícios', () => {
    renderWithProviders(<HomePage />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Fundação da aplicação configurada',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument()
    expect(screen.queryByText(/saldo:/i)).not.toBeInTheDocument()
  })
})
