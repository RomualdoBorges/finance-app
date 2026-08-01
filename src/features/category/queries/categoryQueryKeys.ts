export const categoryQueryRoot = ['categories'] as const

export function categoriesByGroupQueryKey(groupId: string) {
  return [...categoryQueryRoot, 'group', groupId] as const
}

export function categoryByIdQueryKey(groupId: string, categoryId: string) {
  return [...categoriesByGroupQueryKey(groupId), 'detail', categoryId] as const
}
