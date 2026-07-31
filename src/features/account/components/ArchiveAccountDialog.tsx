import * as Dialog from '@radix-ui/react-dialog'
import { Archive, RotateCcw } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { Account } from '../domain/Account'

export function ArchiveAccountDialog({
  account,
  pending,
  onConfirm,
}: {
  readonly account: Account
  readonly pending: boolean
  readonly onConfirm: () => Promise<void>
}) {
  const restoring = account.isArchived
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button disabled={pending} variant="secondary">
          {restoring ? (
            <RotateCcw aria-hidden="true" size={16} />
          ) : (
            <Archive aria-hidden="true" size={16} />
          )}
          {restoring ? 'Restaurar' : 'Arquivar'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold">
            {restoring ? 'Restaurar conta?' : 'Arquivar conta?'}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            {restoring
              ? `“${account.name}” voltará a ficar disponível. O nome precisa continuar único entre as contas ativas.`
              : `“${account.name}” será preservada para o histórico e não ficará disponível para novos lançamentos futuros.`}
          </Dialog.Description>
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button disabled={pending} variant="secondary">
                Cancelar
              </Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button disabled={pending} onClick={() => void onConfirm()}>
                {restoring ? 'Restaurar conta' : 'Arquivar conta'}
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
