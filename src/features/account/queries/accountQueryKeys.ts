export const accountQueryRoot = ['accounts'] as const
export const accountsByGroupQueryKey = (groupId: string) =>
  [...accountQueryRoot, 'group', groupId] as const
