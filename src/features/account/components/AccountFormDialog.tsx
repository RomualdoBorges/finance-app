import { zodResolver } from '@hookform/resolvers/zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../../components/ui/Button'
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../domain/Account'
import { AccountError } from '../domain/AccountError'
import { createAccountSchema } from '../domain/accountSchemas'
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_LABELS,
  getAccountTypeDefaults,
  type AccountType,
} from '../domain/accountTypes'

type Values = z.input<typeof createAccountSchema>
export function AccountFormDialog({
  account,
  pending,
  onSubmit,
}: {
  readonly account?: Account
  readonly pending: boolean
  readonly onSubmit: (
    input: CreateAccountInput | UpdateAccountInput,
  ) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: account?.name ?? '',
      description: account?.description ?? '',
      institutionName: account?.institutionName ?? '',
      icon: account?.icon ?? '',
      color: account?.color ?? '',
      accountType: account?.accountType ?? 'other',
      includeInBalance: account?.includeInBalance ?? true,
      includeInNetWorth: account?.includeInNetWorth ?? true,
    },
  })
  const accountTypeRegistration = register('accountType')
  const submit = handleSubmit(async (values) => {
    try {
      const input = {
        ...values,
        description: values.description ?? null,
        institutionName: values.institutionName ?? null,
        icon: values.icon ?? null,
        color: values.color ?? null,
      }
      await onSubmit(
        account === undefined ? input : { ...input, accountId: account.id },
      )
      reset()
      setOpen(false)
    } catch (error) {
      setError('root', {
        message:
          error instanceof AccountError
            ? error.message
            : 'Não foi possível salvar a conta.',
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
        <Button variant={account === undefined ? 'primary' : 'secondary'}>
          {account === undefined ? null : (
            <Pencil aria-hidden="true" size={16} />
          )}
          {account === undefined ? 'Adicionar conta' : 'Editar'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
          <div className="flex justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {account ? 'Editar conta' : 'Nova conta'}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Defina a identificação e como a conta participará de futuros
                consolidados. Nenhum valor é calculado nesta etapa.
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
            <Field label="Nome" error={errors.name?.message}>
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('name')}
              />
            </Field>
            <Field label="Tipo da conta" error={errors.accountType?.message}>
              <select
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...accountTypeRegistration}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  const previousType = getValues('accountType')
                  void accountTypeRegistration.onChange(event)
                  const nextType = event.target.value as AccountType
                  const previousDefaults = getAccountTypeDefaults(previousType)
                  const nextDefaults = getAccountTypeDefaults(nextType)
                  if (
                    getValues('includeInBalance') ===
                    previousDefaults.includeInBalance
                  )
                    setValue(
                      'includeInBalance',
                      nextDefaults.includeInBalance,
                      { shouldDirty: true },
                    )
                  if (
                    getValues('includeInNetWorth') ===
                    previousDefaults.includeInNetWorth
                  )
                    setValue(
                      'includeInNetWorth',
                      nextDefaults.includeInNetWorth,
                      { shouldDirty: true },
                    )
                }}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {ACCOUNT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-xs text-muted-foreground">
              Ao trocar o tipo, os padrões são reaplicados somente às opções que
              ainda não foram personalizadas.
            </p>
            <CheckboxField
              label="Incluir no saldo"
              description="Define a participação em um futuro saldo financeiro consolidado."
              error={errors.includeInBalance?.message}
            >
              <input type="checkbox" {...register('includeInBalance')} />
            </CheckboxField>
            <CheckboxField
              label="Incluir no patrimônio"
              description="Define a participação no futuro patrimônio líquido consolidado. Cartões serão tratados como passivos."
              error={errors.includeInNetWorth?.message}
            >
              <input type="checkbox" {...register('includeInNetWorth')} />
            </CheckboxField>
            <Field
              label="Instituição (opcional)"
              error={errors.institutionName?.message}
            >
              <input
                className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                {...register('institutionName')}
              />
            </Field>
            <Field
              label="Descrição (opcional)"
              error={errors.description?.message}
            >
              <textarea
                className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2"
                {...register('description')}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ícone (opcional)" error={errors.icon?.message}>
                <input
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                  placeholder="wallet"
                  {...register('icon')}
                />
              </Field>
              <Field label="Cor (opcional)" error={errors.color?.message}>
                <input
                  className="mt-1 min-h-10 w-full rounded-md border border-border bg-background px-3"
                  placeholder="#2563eb"
                  {...register('color')}
                />
              </Field>
            </div>
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
                {pending ? 'Salvando…' : 'Salvar conta'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function CheckboxField({
  label,
  description,
  error,
  children,
}: {
  readonly label: string
  readonly description: string
  readonly error: string | undefined
  readonly children: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-3 rounded-md border border-border p-3">
      <span className="mt-1">{children}</span>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
        {error ? (
          <span className="mt-1 block text-sm text-danger">{error}</span>
        ) : null}
      </span>
    </label>
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
