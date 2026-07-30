import { useGroup } from './useGroup'

export function useActiveGroup() {
  const { activeGroup, membership, status, error, refresh } = useGroup()
  return {
    activeGroup,
    membership,
    loading: status === 'loading',
    error,
    refresh,
  } as const
}
