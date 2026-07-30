import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '../../../components/ui/Button'
import type { Category, CreateCustomCategoryInput } from '../domain/Category'
import { CategoryError } from '../domain/CategoryError'
import { createCustomCategorySchema } from '../domain/categorySchemas'

type FormValues = z.input<typeof createCustomCategorySchema>

type CreateCategoryDialogProps = {
  readonly categories: readonly Category[]
  readonly creating: boolean
  readonly onCreate: (input: CreateCustomCategoryInput) => Promise<unknown>
}

export function CreateCategoryDialog({
  categories,
  creating,
  onCreate,
}: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const rootCategories = useMemo(
    () =>
      categories.filter(({ parentCategoryId }) => parentCategoryId === null),
    [categories],
  )
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createCustomCategorySchema),
    defaultValues: {
      name: '',
      type: 'expense',
      parentCategoryId: null,
      icon: null,
    },
  })
  const parentCategoryId = useWatch({ control, name: 'parentCategoryId' })
  const selectedParent = rootCategories.find(
    ({ id }) => id === parentCategoryId,
  )

  useEffect(() => {
    if (selectedParent !== undefined) {
      setValue('type', selectedParent.type, { shouldValidate: true })
    }
  }, [selectedParent, setValue])

  const submit = handleSubmit(async (values) => {
    try {
      await onCreate({
        name: values.name,
        type: values.type,
        parentCategoryId: values.parentCategoryId ?? null,
        icon: null,
      })
      reset()
      setOpen(false)
    } catch (error) {
      setError('root', {
        message:
          error instanceof CategoryError
            ? error.message
            : 'Não foi possível criar a categoria.',
      })
    }
  })

  return (
    <Dialog.Root
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
      open={open}
    >
      <Dialog.Trigger asChild>
        <Button>Adicionar categoria</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Nova categoria
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Crie uma categoria principal ou uma subcategoria.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Fechar"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <X aria-hidden="true" size={18} />
            </Dialog.Close>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => void submit(event)}
          >
            <label className="block text-sm font-medium text-foreground">
              Nome
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-foreground"
                {...register('name')}
              />
              {errors.name ? (
                <span className="mt-1 block text-sm text-danger">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-foreground">
              Categoria principal (opcional)
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-foreground"
                {...register('parentCategoryId', {
                  setValueAs: (value: unknown) => (value === '' ? null : value),
                })}
              >
                <option value="">Nenhuma — categoria principal</option>
                {rootCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} (
                    {category.type === 'expense' ? 'despesa' : 'receita'})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-foreground">
              Tipo
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 text-foreground disabled:opacity-60"
                disabled={selectedParent !== undefined}
                {...register('type')}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
              {selectedParent !== undefined ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  O tipo é herdado da categoria principal.
                </span>
              ) : null}
            </label>

            {errors.root ? (
              <p className="text-sm text-danger" role="alert">
                {errors.root.message}
              </p>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <Button disabled={creating} variant="secondary">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button disabled={creating} type="submit">
                {creating ? 'Salvando…' : 'Salvar categoria'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
