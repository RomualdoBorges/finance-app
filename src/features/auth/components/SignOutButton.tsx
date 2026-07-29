import { LogOut } from 'lucide-react'

import { Button } from '../../../components/ui/Button'
import { useSignOut } from '../hooks/useAuthMutations'

export function SignOutButton() {
  const signOut = useSignOut()

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        aria-label={signOut.isPending ? 'Saindo da conta' : 'Sair da conta'}
        disabled={signOut.isPending}
        onClick={() => {
          if (!signOut.isPending) signOut.mutate()
        }}
        variant="secondary"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {signOut.isPending ? 'Saindo...' : 'Sair'}
      </Button>
      {signOut.isError ? (
        <p className="max-w-64 text-right text-xs text-danger" role="alert">
          {signOut.error.message}
        </p>
      ) : null}
    </div>
  )
}
