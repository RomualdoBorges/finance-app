import { AlertTriangle, LoaderCircle } from 'lucide-react'

import { Button } from '../../../components/ui/Button'
import { useUserProfile } from '../hooks/useUserProfile'

export function UserProfileStatusNotice() {
  const { status, error, refreshProfile } = useUserProfile()

  if (status === 'idle' || status === 'ready') {
    return (
      <span className="sr-only" data-testid="user-profile-status">
        {status === 'ready'
          ? 'Dados da conta carregados'
          : 'Dados da conta inativos'}
      </span>
    )
  }

  if (status === 'loading') {
    return (
      <div
        className="border-b border-border bg-muted px-4 py-2 text-sm text-muted-foreground sm:px-6"
        data-testid="user-profile-status"
        role="status"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <LoaderCircle
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
            size={17}
          />
          Carregando dados da conta…
        </div>
      </div>
    )
  }

  return (
    <div
      className="border-b border-danger/40 bg-danger/10 px-4 py-3 sm:px-6"
      data-testid="user-profile-status"
      role="alert"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
        <AlertTriangle aria-hidden="true" className="shrink-0" size={19} />
        <p className="min-w-0 flex-1 text-sm">
          {error?.message ?? 'Não foi possível carregar os dados da conta.'}
        </p>
        <Button
          className="min-h-9"
          onClick={() => void refreshProfile()}
          variant="secondary"
        >
          Tentar novamente
        </Button>
      </div>
    </div>
  )
}
