import { useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/ui/AppState'
import { formatMinorToCurrency } from '../../../shared/money/money'
import { formatCivilDateBR } from '../../../lib/date'
import { useAccounts } from '../../account/hooks/useAccounts'
import { useCategories } from '../../category/hooks/useCategories'
import { TransactionFormDialog } from '../components/TransactionFormDialog'
import { TRANSACTION_TYPE_LABELS } from '../domain/Transaction'
import { useCreateTransaction } from '../hooks/useCreateTransaction'
import { useTransactions } from '../hooks/useTransactions'
import {
  getTransactionDisplayStatus,
  getTransactionStatusLabel,
} from '../domain/transactionStatus'
import { getTodayCivilDate } from '../../../lib/date'
import { Button } from '../../../components/ui/Button'
import { useTransactionMutations } from '../hooks/useTransactionMutations'

export function TransactionsPage() {
  const listing = useTransactions()
  const accounts = useAccounts()
  const categories = useCategories()
  const creation = useCreateTransaction()
  const [feedback, setFeedback] = useState<string | null>(null)
  const lifecycle = useTransactionMutations()
  const loading = listing.loading || accounts.loading || categories.loading
  const error = listing.error ?? accounts.error ?? categories.error
  const accountNames = new Map(
    accounts.accounts.map((item) => [item.id, item.name]),
  )
  const categoryNames = new Map(
    categories.categories.map((item) => [item.id, item.name]),
  )
  const today = getTodayCivilDate()
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre e visualize receitas e despesas. Nenhum lançamento altera
            saldos nesta etapa.
          </p>
        </div>
        {!loading && error === null ? (
          <TransactionFormDialog
            accounts={accounts.accounts}
            categories={categories.categories}
            pending={creation.pending}
            onSubmit={async (input) => {
              setFeedback(null)
              await creation.createTransaction(input)
              setFeedback('Lançamento criado com sucesso.')
            }}
          />
        ) : null}
      </header>
      {feedback ? (
        <p className="rounded-md bg-success/10 p-3 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
      {creation.error ? (
        <p
          className="rounded-md bg-danger/10 p-3 text-sm text-danger"
          role="alert"
        >
          {creation.error.message}
        </p>
      ) : null}
      {loading ? <LoadingState title="Carregando lançamentos…" /> : null}
      {!loading && error ? (
        <ErrorState
          description={error.message}
          onRetry={() =>
            void Promise.all([
              listing.refresh(),
              accounts.refresh(),
              categories.refresh(),
            ])
          }
        />
      ) : null}
      {!loading && error === null && listing.transactions.length === 0 ? (
        <EmptyState
          title="Nenhum lançamento cadastrado"
          description="Adicione sua primeira receita ou despesa."
        />
      ) : null}
      {!loading && error === null && listing.transactions.length > 0 ? (
        <>
          <ul className="grid gap-3 lg:grid-cols-2">
            {listing.transactions.map((item) => (
              <li
                className="rounded-lg border border-border bg-surface p-4"
                key={item.id}
              >
                <p className="font-medium">
                  {item.operationKind === 'reversal'
                    ? 'Estorno: '
                    : item.operationKind === 'refund'
                      ? 'Reembolso: '
                      : ''}
                  {item.description}
                </p>
                <p className="mt-1 text-sm">
                  Status:{' '}
                  <span className="rounded-full border border-border px-2 py-0.5 font-medium">
                    {getTransactionStatusLabel(
                      getTransactionDisplayStatus(item, today),
                    )}
                  </span>
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">
                    {TRANSACTION_TYPE_LABELS[item.type]}
                  </span>{' '}
                  · {formatMinorToCurrency(item.amountMinor)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {accountNames.get(item.accountId) ?? 'Conta indisponível'} ·{' '}
                  {categoryNames.get(item.categoryId) ??
                    'Categoria indisponível'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Competência:{' '}
                  {item.competenceDate === null
                    ? 'não informada'
                    : formatCivilDateBR(item.competenceDate)}
                </p>
                {item.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.notes}
                  </p>
                ) : null}
                {item.operationKind === 'normal' &&
                item.status !== 'canceled' ? (
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    aria-label={`Ações de ${item.description}`}
                  >
                    {['planned', 'pending'].includes(item.status) ? (
                      <Button
                        disabled={lifecycle.pending}
                        variant="secondary"
                        onClick={() => {
                          const description = window.prompt(
                            'Descrição do lançamento:',
                            item.description,
                          )
                          if (description)
                            void lifecycle.update
                              .mutateAsync({
                                id: item.id,
                                input: {
                                  type: item.type,
                                  description,
                                  amountMinor: item.amountMinor,
                                  accountId: item.accountId,
                                  categoryId: item.categoryId,
                                  notes: item.notes,
                                  competenceDate: item.competenceDate!,
                                  dueDate: item.dueDate!,
                                  paymentDate: item.paymentDate!,
                                },
                              })
                              .then(() => setFeedback('Lançamento editado.'))
                        }}
                      >
                        Editar
                      </Button>
                    ) : null}
                    {['planned', 'pending'].includes(item.status) ? (
                      <Button
                        disabled={lifecycle.pending}
                        variant="secondary"
                        onClick={() =>
                          void lifecycle.confirm
                            .mutateAsync(item.id)
                            .then(() => setFeedback('Lançamento confirmado.'))
                        }
                      >
                        Confirmar
                      </Button>
                    ) : null}
                    <Button
                      disabled={lifecycle.pending}
                      variant="secondary"
                      onClick={() => {
                        const reason = window.prompt(
                          'Informe o motivo do cancelamento:',
                        )
                        if (reason)
                          void lifecycle.cancel
                            .mutateAsync({ id: item.id, reason })
                            .then(() => setFeedback('Lançamento cancelado.'))
                      }}
                    >
                      Cancelar
                    </Button>
                    {item.status === 'confirmed' &&
                    !item.reversedByTransactionId ? (
                      <Button
                        disabled={lifecycle.pending}
                        variant="secondary"
                        onClick={() => {
                          const categoryId = window.prompt(
                            'Informe o ID de uma categoria compatível para o estorno:',
                          )
                          if (categoryId)
                            void lifecycle.reversal
                              .mutateAsync({
                                transaction: item,
                                input: {
                                  accountId: item.accountId,
                                  categoryId,
                                  notes: null,
                                },
                              })
                              .then(() => setFeedback('Estorno criado.'))
                        }}
                      >
                        Estornar
                      </Button>
                    ) : null}
                    {item.status === 'confirmed' &&
                    !item.refundedByTransactionId ? (
                      <Button
                        disabled={lifecycle.pending}
                        variant="secondary"
                        onClick={() => {
                          const categoryId = window.prompt(
                            'Informe o ID de uma categoria compatível para o reembolso:',
                          )
                          if (categoryId)
                            void lifecycle.refund
                              .mutateAsync({
                                transaction: item,
                                input: {
                                  accountId: item.accountId,
                                  categoryId,
                                  notes: null,
                                },
                              })
                              .then(() => setFeedback('Reembolso criado.'))
                        }}
                      >
                        Reembolsar
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Listagem provisória dos 50 lançamentos mais recentes por data de
            cadastro.
          </p>
        </>
      ) : null}
    </div>
  )
}
