import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '../../../components/ui/Button'
import type { Category, UpdateCategoryInput } from '../domain/Category'
import { CategoryError } from '../domain/CategoryError'
import { updateCategorySchema } from '../domain/categorySchemas'

type FormValues = z.input<typeof updateCategorySchema>

export function EditCategoryDialog({
  category,
  categories,
  pending,
  onUpdate,
}: {
  readonly category: Category
  readonly categories: readonly Category[]
  readonly pending: boolean
  readonly onUpdate: (input: UpdateCategoryInput) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const roots = useMemo(
    () =>
      categories.filter(
        (item) =>
          item.id !== category.id &&
          item.parentCategoryId === null &&
          item.status === 'active',
      ),
    [categories, category.id],
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
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      categoryId: category.id,
      name: category.name,
      type: category.type,
      parentCategoryId: category.parentCategoryId,
      icon: category.icon,
    },
  })
  const parentCategoryId = useWatch({ control, name: 'parentCategoryId' })
  const selectedParent = roots.find(({ id }) => id === parentCategoryId)
  useEffect(() => {
    if (selectedParent !== undefined) {
      setValue('type', selectedParent.type, { shouldValidate: true })
    }
  }, [selectedParent, setValue])

  const submit = handleSubmit(async (values) => {
    try {
      await onUpdate({
        categoryId: category.id,
        name: values.name,
        type: values.type,
        parentCategoryId: values.parentCategoryId ?? null,
        icon: values.icon ?? null,
      })
      setOpen(false)
    } catch (error) {
      setError('root', {
        message:
          error instanceof CategoryError
            ? error.message
            : 'Não foi possível editar a categoria.',
      })
    }
  })

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Dialog.Trigger asChild>
        <Button variant="secondary">
          <Pencil aria-hidden="true" size={16} />
          Editar
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Editar categoria
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {category.origin === 'default'
                  ? 'Em categorias padrão, somente nome e ícone podem ser alterados.'
                  : 'Atualize os dados personalizáveis da categoria.'}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Fechar" className="rounded-md p-2">
              <X aria-hidden="true" size={18} />
            </Dialog.Close>
          </div>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => void submit(event)}
          >
            <input type="hidden" {...register('categoryId')} />
            <label className="block text-sm font-medium">
              Nome
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('name')}
              />
              {errors.name ? (
                <span className="mt-1 block text-sm text-danger">
                  {errors.name.message}
                </span>
              ) : null}
            </label>
            <label className="block text-sm font-medium">
              Categoria principal (opcional)
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 disabled:opacity-60"
                disabled={category.origin === 'default'}
                {...register('parentCategoryId', {
                  setValueAs: (value: unknown) => (value === '' ? null : value),
                })}
              >
                <option value="">Nenhuma — categoria principal</option>
                {roots.map((root) => (
                  <option key={root.id} value={root.id}>
                    {root.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Tipo
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3 disabled:opacity-60"
                disabled={
                  category.origin === 'default' || selectedParent !== undefined
                }
                {...register('type')}
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </label>
            {errors.root ? (
              <p role="alert" className="text-sm text-danger">
                {errors.root.message}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button disabled={pending} variant="secondary">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button disabled={pending} type="submit">
                {pending ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
