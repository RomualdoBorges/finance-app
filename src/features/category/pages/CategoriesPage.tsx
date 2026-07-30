import { Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { Category, CategoryType } from '../domain/Category'
import { CreateCategoryDialog } from '../components/CreateCategoryDialog'
import { EditCategoryDialog } from '../components/EditCategoryDialog'
import { Button } from '../../../components/ui/Button'
import { useCategories } from '../hooks/useCategories'
import { useCreateCategory } from '../hooks/useCreateCategory'
import { useCategoryMutations } from '../hooks/useCategoryMutations'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/ui/AppState'

function CategoryBranch({
  category,
  categories,
  pending,
  onAction,
  onUpdate,
}: {
  readonly category: Category
  readonly categories: readonly Category[]
  readonly pending: boolean
  readonly onAction: (
    action: 'archive' | 'restore' | 'delete',
    category: Category,
  ) => Promise<void>
  readonly onUpdate: Parameters<typeof EditCategoryDialog>[0]['onUpdate']
}) {
  const children = categories.filter(
    ({ parentCategoryId }) => parentCategoryId === category.id,
  )
  return (
    <li
      className={`rounded-lg border border-border p-4 ${
        category.status === 'archived'
          ? 'border-dashed bg-muted opacity-75'
          : 'bg-surface'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">{category.name}</span>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          {category.origin === 'default' ? 'Padrão' : 'Personalizada'}
        </span>
      </div>
      {category.status === 'archived' ? (
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Arquivada — mantida para histórico e relatórios
        </p>
      ) : null}
      {children.length > 0 ? (
        <ul className="mt-3 space-y-2 border-l border-border pl-4">
          {children
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
            .map((child) => (
              <li
                className="flex items-center justify-between gap-2 text-sm"
                key={child.id}
              >
                <span
                  className={
                    child.status === 'archived'
                      ? 'text-muted-foreground line-through'
                      : 'text-foreground'
                  }
                >
                  {child.name}
                  {child.status === 'archived' ? ' (arquivada)' : ''}
                </span>
                <CategoryControls
                  categories={categories}
                  category={child}
                  onAction={onAction}
                  onUpdate={onUpdate}
                  pending={pending}
                />
              </li>
            ))}
        </ul>
      ) : null}
      <div className="mt-4">
        <CategoryControls
          categories={categories}
          category={category}
          onAction={onAction}
          onUpdate={onUpdate}
          pending={pending}
        />
      </div>
    </li>
  )
}

function CategoryControls({
  category,
  categories,
  pending,
  onAction,
  onUpdate,
}: {
  readonly category: Category
  readonly categories: readonly Category[]
  readonly pending: boolean
  readonly onAction: (
    action: 'archive' | 'restore' | 'delete',
    category: Category,
  ) => Promise<void>
  readonly onUpdate: Parameters<typeof EditCategoryDialog>[0]['onUpdate']
}) {
  const hasChildren = categories.some(
    ({ parentCategoryId }) => parentCategoryId === category.id,
  )
  return (
    <div className="flex flex-wrap items-center gap-2">
      {category.status === 'active' ? (
        <>
          <EditCategoryDialog
            categories={categories}
            category={category}
            onUpdate={onUpdate}
            pending={pending}
          />
          <Button
            disabled={pending}
            onClick={() => void onAction('archive', category)}
            variant="secondary"
          >
            <Archive aria-hidden="true" size={16} />
            Arquivar
          </Button>
        </>
      ) : (
        <Button
          disabled={pending}
          onClick={() => void onAction('restore', category)}
          variant="secondary"
        >
          <RotateCcw aria-hidden="true" size={16} />
          Restaurar
        </Button>
      )}
      {category.origin === 'custom' &&
      category.usageCount === 0 &&
      category.parentCategoryId !== null &&
      !hasChildren ? (
        <Button
          disabled={pending}
          onClick={() => void onAction('delete', category)}
          className="bg-danger text-white hover:opacity-90"
        >
          <Trash2 aria-hidden="true" size={16} />
          Excluir
        </Button>
      ) : null}
      {category.usageCount > 0 ? (
        <span className="text-xs text-muted-foreground">
          Já utilizada: pode ser arquivada, mas não excluída.
        </span>
      ) : null}
    </div>
  )
}

function CategorySection({
  categories,
  title,
  type,
  pending,
  onAction,
  onUpdate,
}: {
  readonly categories: readonly Category[]
  readonly title: string
  readonly type: CategoryType
  readonly pending: boolean
  readonly onAction: (
    action: 'archive' | 'restore' | 'delete',
    category: Category,
  ) => Promise<void>
  readonly onUpdate: Parameters<typeof EditCategoryDialog>[0]['onUpdate']
}) {
  const roots = categories
    .filter(
      (category) =>
        category.type === type && category.parentCategoryId === null,
    )
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))

  return (
    <section aria-labelledby={`category-${type}`}>
      <h2
        className="text-lg font-semibold text-foreground"
        id={`category-${type}`}
      >
        {title}
      </h2>
      <ul className="mt-3 grid gap-3 lg:grid-cols-2">
        {roots.map((category) => (
          <CategoryBranch
            categories={categories}
            category={category}
            key={category.id}
            onAction={onAction}
            onUpdate={onUpdate}
            pending={pending}
          />
        ))}
      </ul>
    </section>
  )
}

export function CategoriesPage() {
  const { categories, loading, error, refresh } = useCategories()
  const creation = useCreateCategory()
  const mutations = useCategoryMutations()
  const [feedback, setFeedback] = useState<string | null>(null)

  const action = async (
    kind: 'archive' | 'restore' | 'delete',
    category: Category,
  ) => {
    const confirmed =
      kind === 'restore' ||
      window.confirm(
        kind === 'archive'
          ? `Arquivar “${category.name}”? Subcategorias ativas também serão arquivadas.`
          : `Excluir “${category.name}” permanentemente?`,
      )
    if (!confirmed) return
    setFeedback(null)
    if (kind === 'archive') {
      await mutations.archiveCategory({ categoryId: category.id })
      setFeedback('Categoria arquivada com sucesso.')
    } else if (kind === 'restore') {
      await mutations.restoreCategory({ categoryId: category.id })
      setFeedback('Categoria restaurada com sucesso.')
    } else {
      await mutations.deleteCategory({ categoryId: category.id })
      setFeedback('Categoria excluída com sucesso.')
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Organize receitas e despesas com categorias padrão ou
            personalizadas.
          </p>
        </div>
        {!loading && error === null ? (
          <CreateCategoryDialog
            categories={categories}
            creating={creation.creating}
            onCreate={creation.createCategory}
          />
        ) : null}
      </header>

      {feedback !== null ? (
        <p className="rounded-md bg-success/10 p-3 text-sm" role="status">
          {feedback}
        </p>
      ) : null}
      {mutations.error !== null ? (
        <p
          className="rounded-md bg-danger/10 p-3 text-sm text-danger"
          role="alert"
        >
          {mutations.error.message}
        </p>
      ) : null}

      {loading ? <LoadingState title="Preparando categorias…" /> : null}
      {!loading && error !== null ? (
        <ErrorState
          description={error.message}
          onRetry={() => void refresh()}
        />
      ) : null}
      {!loading && error === null && categories.length === 0 ? (
        <EmptyState
          description="Tente recarregar para criar o catálogo inicial."
          title="Nenhuma categoria disponível"
        />
      ) : null}
      {!loading && error === null && categories.length > 0 ? (
        <div className="space-y-8">
          <CategorySection
            categories={categories}
            title="Despesas"
            type="expense"
            onAction={action}
            onUpdate={mutations.updateCategory}
            pending={mutations.pending}
          />
          <CategorySection
            categories={categories}
            title="Receitas"
            type="income"
            onAction={action}
            onUpdate={mutations.updateCategory}
            pending={mutations.pending}
          />
        </div>
      ) : null}
    </div>
  )
}
