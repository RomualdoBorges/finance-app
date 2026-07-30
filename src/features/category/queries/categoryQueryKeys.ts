export const categoryQueryRoot = ['categories'] as const

export function categoriesByGroupQueryKey(groupId: string) {
  return [...categoryQueryRoot, 'group', groupId] as const
}
