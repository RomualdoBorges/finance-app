import { describe, expect, it } from 'vitest'

import { defaultCategoryCatalog } from './defaultCategoryCatalog'
import { normalizeCategoryName } from './normalizeCategoryName'

describe('defaultCategoryCatalog', () => {
  it('tem IDs determinísticos únicos e nomes normalizados', () => {
    const ids = defaultCategoryCatalog.map(({ id }) => id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => /^[a-z0-9-]+$/.test(id))).toBe(true)
    expect(
      defaultCategoryCatalog.every(
        (category) =>
          category.normalizedName === normalizeCategoryName(category.name),
      ),
    ).toBe(true)
  })

  it('limita a hierarquia a um nível e preserva o tipo do pai', () => {
    const byId = new Map(
      defaultCategoryCatalog.map((category) => [category.id, category]),
    )
    for (const category of defaultCategoryCatalog) {
      if (category.parentCategoryId === null) continue
      const parent = byId.get(category.parentCategoryId)
      expect(parent).toBeDefined()
      expect(parent?.parentCategoryId).toBeNull()
      expect(parent?.type).toBe(category.type)
    }
  })

  it('oferece catálogo equilibrado de receitas e despesas', () => {
    expect(defaultCategoryCatalog.some(({ type }) => type === 'expense')).toBe(
      true,
    )
    expect(defaultCategoryCatalog.some(({ type }) => type === 'income')).toBe(
      true,
    )
  })
})
