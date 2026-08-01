import { Landmark } from 'lucide-react'
import { useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/ui/AppState'
import { AccountFormDialog } from '../components/AccountFormDialog'
import { ArchiveAccountDialog } from '../components/ArchiveAccountDialog'
import type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../domain/Account'
import { useAccountMutations } from '../hooks/useAccountMutations'
import { useAccounts } from '../hooks/useAccounts'
import { ACCOUNT_TYPE_LABELS } from '../domain/accountTypes'
import { formatMinorToCurrency } from '../../../shared/money/money'
import { format, parseISO } from 'date-fns'

export function AccountsPage() {
  const { accounts, loading, error, refresh } = useAccounts()
  const mutations = useAccountMutations()
  const [feedback, setFeedback] = useState<string | null>(null)

  const submit = async (input: CreateAccountInput | UpdateAccountInput) => {
    setFeedback(null)
    if ('accountId' in input) {
      await mutations.updateAccount(input)
      setFeedback('Conta atualizada com sucesso.')
    } else {
      await mutations.createAccount(input)
      setFeedback('Conta criada com sucesso.')
    }
  }
  const toggle = async (account: Account) => {
    setFeedback(null)
    if (account.isArchived) {
      await mutations.restoreAccount({ accountId: account.id })
      setFeedback('Conta restaurada com sucesso.')
    } else {
      await mutations.archiveAccount({ accountId: account.id })
      setFeedback('Conta arquivada com sucesso.')
    }
  }

  const active = accounts.filter((account) => !account.isArchived)
  const archived = accounts.filter((account) => account.isArchived)
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Contas</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre e organize suas contas e opções de participação em futuros
            consolidados. Nenhum valor financeiro é calculado nesta etapa.
          </p>
        </div>
        {!loading && error === null ? (
          <AccountFormDialog pending={mutations.pending} onSubmit={submit} />
        ) : null}
      </header>
      {feedback ? (
        <p className="rounded-md bg-success/10 p-3 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
      {mutations.error ? (
        <p
          className="rounded-md bg-danger/10 p-3 text-sm text-danger"
          role="alert"
        >
          {mutations.error.message}
        </p>
      ) : null}
      {loading ? <LoadingState title="Carregando contas…" /> : null}
      {!loading && error ? (
        <ErrorState
          description={error.message}
          onRetry={() => void refresh()}
        />
      ) : null}
      {!loading && error === null && accounts.length === 0 ? (
        <EmptyState
          title="Nenhuma conta cadastrada"
          description="Adicione sua primeira conta para começar a organização."
        />
      ) : null}
      {!loading && error === null && accounts.length > 0 ? (
        <div className="space-y-8">
          <AccountSection
            accounts={active}
            title="Contas ativas"
            empty="Nenhuma conta ativa."
            pending={mutations.pending}
            onSubmit={submit}
            onToggle={toggle}
          />
          <AccountSection
            accounts={archived}
            title="Contas arquivadas"
            empty="Nenhuma conta arquivada."
            pending={mutations.pending}
            onSubmit={submit}
            onToggle={toggle}
          />
          <p className="text-sm text-muted-foreground">
            Contas não são excluídas definitivamente: elas são preservadas para
            manter a integridade do histórico financeiro futuro.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function AccountSection({
  accounts,
  title,
  empty,
  pending,
  onSubmit,
  onToggle,
}: {
  readonly accounts: readonly Account[]
  readonly title: string
  readonly empty: string
  readonly pending: boolean
  readonly onSubmit: (
    input: CreateAccountInput | UpdateAccountInput,
  ) => Promise<unknown>
  readonly onToggle: (account: Account) => Promise<void>
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      {accounts.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {accounts.map((account) => (
            <li
              className={`rounded-lg border border-border p-4 ${account.isArchived ? 'border-dashed bg-muted opacity-75' : 'bg-surface'}`}
              key={account.id}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-muted p-2">
                  <Landmark aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {account.institutionName ?? 'Sem instituição informada'}
                  </p>
                  <p className="mt-1 text-sm">
                    {ACCOUNT_TYPE_LABELS[account.accountType]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account.includeInBalance
                      ? 'Inclui no saldo'
                      : 'Não inclui no saldo'}
                    {' · '}
                    {account.includeInNetWorth
                      ? 'Inclui no patrimônio'
                      : 'Não inclui no patrimônio'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saldo inicial:{' '}
                    {formatMinorToCurrency(account.initialBalanceMinor)}{' '}
                    {account.initialBalanceDate === null
                      ? '· data não informada'
                      : `em ${format(parseISO(account.initialBalanceDate), 'dd/MM/yyyy')}`}
                  </p>
                  {account.isArchived ? (
                    <p className="mt-1 text-xs font-medium">Arquivada</p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!account.isArchived ? (
                  <AccountFormDialog
                    account={account}
                    pending={pending}
                    onSubmit={onSubmit}
                  />
                ) : null}
                <ArchiveAccountDialog
                  account={account}
                  pending={pending}
                  onConfirm={() => onToggle(account)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
