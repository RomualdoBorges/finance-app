import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../../components/ui/Button'
import type { Account } from '../../account/domain/Account'
import type { Category } from '../../category/domain/Category'
import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  type CreateTransactionInput,
} from '../domain/Transaction'
import { TransactionError } from '../domain/TransactionError'
import { createTransactionSchema } from '../domain/transactionSchemas'
import { parseCurrencyToMinor } from '../../../shared/money/money'
import { getTodayCivilDate } from '../../../lib/date'
import {
  CREATABLE_TRANSACTION_STATUSES,
  DEFAULT_TRANSACTION_STATUS,
  getTransactionStatusLabel,
} from '../domain/transactionStatus'

const formSchema = createTransactionSchema.omit({ amountMinor: true }).extend({
  amount: z.string().refine((value) => {
    const amount = parseCurrencyToMinor(value)
    return amount !== null && amount > 0
  }, 'Informe um valor maior que zero com até duas casas decimais.'),
})
type Values = z.input<typeof formSchema>

export function TransactionFormDialog({
  accounts,
  categories,
  pending,
  onSubmit,
}: {
  readonly accounts: readonly Account[]
  readonly categories: readonly Category[]
  readonly pending: boolean
  readonly onSubmit: (input: CreateTransactionInput) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const today = getTodayCivilDate()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      status: DEFAULT_TRANSACTION_STATUS,
      description: '',
      amount: '',
      accountId: '',
      categoryId: '',
      notes: '',
      competenceDate: today,
      dueDate: today,
      paymentDate: today,
    },
  })
  const type = useWatch({ control, name: 'type' }) ?? 'expense'
  const availableCategories = categories.filter(
    (item) => item.status === 'active' && item.type === type,
  )
  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({
        type: values.type,
        status: values.status,
        description: values.description,
        amountMinor: parseCurrencyToMinor(values.amount)!,
        accountId: values.accountId,
        categoryId: values.categoryId,
        notes: values.notes ?? null,
        competenceDate: values.competenceDate,
        dueDate: values.dueDate,
        paymentDate: values.paymentDate,
      })
      reset()
      setOpen(false)
    } catch (error) {
      setError('root', {
        message:
          error instanceof TransactionError
            ? error.message
            : 'Não foi possível salvar o lançamento.',
      })
    }
  })
  const typeRegistration = register('type')
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <Dialog.Trigger asChild>
        <Button>
          <Plus aria-hidden="true" size={16} />
          Novo lançamento
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
          <div className="flex justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Novo lançamento
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Cadastre uma receita ou despesa. Esta etapa não altera saldos.
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
            <Field label="Tipo" error={errors.type?.message}>
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...typeRegistration}
                onChange={(event) => {
                  void typeRegistration.onChange(event)
                  const selected = categories.find(
                    (item) => item.id === getValues('categoryId'),
                  )
                  if (selected && selected.type !== event.target.value)
                    setValue('categoryId', '')
                }}
              >
                {TRANSACTION_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {TRANSACTION_TYPE_LABELS[item]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('status')}
              >
                {CREATABLE_TRANSACTION_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {getTransactionStatusLabel(item)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descrição" error={errors.description?.message}>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('description')}
              />
            </Field>
            <Field label="Valor" error={errors.amount?.message}>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                inputMode="decimal"
                placeholder="R$ 0,00"
                {...register('amount')}
              />
            </Field>
            <Field label="Conta" error={errors.accountId?.message}>
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('accountId')}
              >
                <option value="">Selecione uma conta</option>
                {accounts
                  .filter((item) => !item.isArchived)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Competência" error={errors.competenceDate?.message}>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                type="date"
                {...register('competenceDate')}
              />
            </Field>
            <Field label="Vencimento" error={errors.dueDate?.message}>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                type="date"
                {...register('dueDate')}
              />
            </Field>
            <Field label="Pagamento" error={errors.paymentDate?.message}>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                type="date"
                {...register('paymentDate')}
              />
            </Field>
            <Field label="Categoria" error={errors.categoryId?.message}>
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('categoryId')}
              >
                <option value="">Selecione uma categoria</option>
                {availableCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Observação (opcional)" error={errors.notes?.message}>
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2"
                {...register('notes')}
              />
            </Field>
            {errors.root ? (
              <p className="text-sm text-danger" role="alert">
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
                {pending ? 'Salvando…' : 'Salvar lançamento'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
function Field({
  label,
  error,
  children,
}: {
  readonly label: string
  readonly error: string | undefined
  readonly children: React.ReactNode
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-danger">{error}</span>
      ) : null}
    </label>
  )
}
