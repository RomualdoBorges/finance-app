import { describe, expect, it } from 'vitest'

import { normalizeCategoryName } from './normalizeCategoryName'

describe('normalizeCategoryName', () => {
  it('remove acentos, normaliza caixa e espaços', () => {
    expect(normalizeCategoryName('  Educação   FÍSICA  ')).toBe(
      'educacao fisica',
    )
  })

  it('mantém números e pontuação relevante', () => {
    expect(normalizeCategoryName('IPVA 2026')).toBe('ipva 2026')
  })
})
