import type { Category, CategoryType } from '../domain/Category'
import { CreateCategoryDialog } from '../components/CreateCategoryDialog'
import { useCategories } from '../hooks/useCategories'
import { useCreateCategory } from '../hooks/useCreateCategory'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/ui/AppState'

function CategoryBranch({
  category,
  categories,
}: {
  readonly category: Category
  readonly categories: readonly Category[]
}) {
  const children = categories.filter(
    ({ parentCategoryId }) => parentCategoryId === category.id,
  )
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground">{category.name}</span>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          {category.origin === 'default' ? 'Padrão' : 'Personalizada'}
        </span>
      </div>
      {children.length > 0 ? (
        <ul className="mt-3 space-y-2 border-l border-border pl-4">
          {children
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
            .map((child) => (
              <li
                className="flex items-center justify-between gap-2 text-sm"
                key={child.id}
              >
                <span className="text-foreground">{child.name}</span>
                <span className="text-xs text-muted-foreground">
                  {child.origin === 'default' ? 'Padrão' : 'Personalizada'}
                </span>
              </li>
            ))}
        </ul>
      ) : null}
    </li>
  )
}

function CategorySection({
  categories,
  title,
  type,
}: {
  readonly categories: readonly Category[]
  readonly title: string
  readonly type: CategoryType
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
          />
        ))}
      </ul>
    </section>
  )
}

export function CategoriesPage() {
  const { categories, loading, error, refresh } = useCategories()
  const creation = useCreateCategory()

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
          />
          <CategorySection
            categories={categories}
            title="Receitas"
            type="income"
          />
        </div>
      ) : null}
    </div>
  )
}
