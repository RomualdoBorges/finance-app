import { useGroup } from './useGroup'

export function useActiveGroup() {
  const { activeGroup, status, error, refresh } = useGroup()
  return {
    activeGroup,
    loading: status === 'loading',
    error,
    refresh,
  } as const
}
