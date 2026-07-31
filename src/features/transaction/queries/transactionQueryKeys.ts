export const transactionQueryRoot = ['transactions'] as const
export const transactionsByGroupQueryKey = (groupId: string) =>
  [...transactionQueryRoot, 'group', groupId] as const
