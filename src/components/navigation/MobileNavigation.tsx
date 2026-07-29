import * as Dialog from '@radix-ui/react-dialog'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

import { NavigationItems } from './NavigationItems'

export function MobileNavigation() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Abrir navegação"
          className="inline-grid size-10 place-items-center rounded-md text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring md:hidden"
          type="button"
        >
          <Menu aria-hidden="true" size={22} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/40 data-[state=open]:animate-in" />
        <Dialog.Content
          aria-describedby="mobile-navigation-description"
          className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] border-r border-border bg-surface p-5 text-foreground shadow-xl focus:outline-none"
        >
          <div className="mb-8 flex items-center justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold">
              Financeiro
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                aria-label="Fechar navegação"
                className="inline-grid size-10 place-items-center rounded-md hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                type="button"
              >
                <X aria-hidden="true" size={21} />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description
            className="sr-only"
            id="mobile-navigation-description"
          >
            Escolha uma área da aplicação.
          </Dialog.Description>
          <nav aria-label="Navegação principal">
            <NavigationItems onNavigate={() => setOpen(false)} />
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
