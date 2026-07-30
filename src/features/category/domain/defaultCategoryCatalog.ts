import type { CategoryDefinition, CategoryType } from './Category'
import { normalizeCategoryName } from './normalizeCategoryName'

type CatalogEntry = {
  readonly id: string
  readonly name: string
  readonly type: CategoryType
  readonly icon: string
  readonly children?: readonly { readonly id: string; readonly name: string }[]
}

const entries: readonly CatalogEntry[] = [
  {
    id: 'expense-housing',
    name: 'Moradia',
    type: 'expense',
    icon: 'house',
    children: [
      { id: 'expense-housing-rent', name: 'Aluguel' },
      { id: 'expense-housing-condominium', name: 'Condomínio' },
      { id: 'expense-housing-electricity', name: 'Energia' },
      { id: 'expense-housing-water', name: 'Água' },
      { id: 'expense-housing-internet', name: 'Internet' },
      { id: 'expense-housing-maintenance', name: 'Manutenção' },
    ],
  },
  {
    id: 'expense-food',
    name: 'Alimentação',
    type: 'expense',
    icon: 'utensils',
    children: [
      { id: 'expense-food-groceries', name: 'Mercado' },
      { id: 'expense-food-restaurants', name: 'Restaurantes' },
      { id: 'expense-food-delivery', name: 'Delivery' },
    ],
  },
  {
    id: 'expense-transportation',
    name: 'Transporte',
    type: 'expense',
    icon: 'car',
    children: [
      { id: 'expense-transportation-fuel', name: 'Combustível' },
      { id: 'expense-transportation-public', name: 'Transporte público' },
      { id: 'expense-transportation-apps', name: 'Aplicativos' },
      { id: 'expense-transportation-maintenance', name: 'Manutenção' },
    ],
  },
  {
    id: 'expense-health',
    name: 'Saúde',
    type: 'expense',
    icon: 'heart-pulse',
    children: [
      { id: 'expense-health-insurance', name: 'Plano de saúde' },
      { id: 'expense-health-medicine', name: 'Medicamentos' },
      { id: 'expense-health-appointments', name: 'Consultas' },
    ],
  },
  {
    id: 'expense-education',
    name: 'Educação',
    type: 'expense',
    icon: 'graduation-cap',
    children: [
      { id: 'expense-education-tuition', name: 'Mensalidades' },
      { id: 'expense-education-courses', name: 'Cursos' },
      { id: 'expense-education-books', name: 'Livros' },
    ],
  },
  {
    id: 'expense-leisure',
    name: 'Lazer',
    type: 'expense',
    icon: 'popcorn',
    children: [
      { id: 'expense-leisure-entertainment', name: 'Entretenimento' },
      { id: 'expense-leisure-travel', name: 'Viagens' },
      { id: 'expense-leisure-hobbies', name: 'Hobbies' },
    ],
  },
  {
    id: 'expense-shopping',
    name: 'Compras',
    type: 'expense',
    icon: 'shopping-bag',
    children: [
      { id: 'expense-shopping-clothing', name: 'Roupas' },
      { id: 'expense-shopping-electronics', name: 'Eletrônicos' },
      { id: 'expense-shopping-home', name: 'Casa' },
    ],
  },
  {
    id: 'expense-personal-care',
    name: 'Cuidados pessoais',
    type: 'expense',
    icon: 'sparkles',
    children: [
      { id: 'expense-personal-care-beauty', name: 'Beleza' },
      { id: 'expense-personal-care-fitness', name: 'Academia' },
    ],
  },
  {
    id: 'expense-debts',
    name: 'Dívidas',
    type: 'expense',
    icon: 'landmark',
    children: [
      { id: 'expense-debts-loans', name: 'Empréstimos' },
      { id: 'expense-debts-financing', name: 'Financiamentos' },
      { id: 'expense-debts-interest', name: 'Juros' },
    ],
  },
  {
    id: 'expense-taxes',
    name: 'Impostos e taxas',
    type: 'expense',
    icon: 'receipt-text',
  },
  {
    id: 'expense-gifts',
    name: 'Presentes e doações',
    type: 'expense',
    icon: 'gift',
  },
  {
    id: 'expense-other',
    name: 'Outras despesas',
    type: 'expense',
    icon: 'circle-ellipsis',
  },
  {
    id: 'income-salary',
    name: 'Salário',
    type: 'income',
    icon: 'wallet-cards',
  },
  {
    id: 'income-freelance',
    name: 'Trabalho autônomo',
    type: 'income',
    icon: 'briefcase-business',
  },
  {
    id: 'income-business',
    name: 'Negócios',
    type: 'income',
    icon: 'store',
  },
  {
    id: 'income-investments',
    name: 'Investimentos',
    type: 'income',
    icon: 'chart-no-axes-combined',
    children: [
      { id: 'income-investments-interest', name: 'Juros' },
      { id: 'income-investments-dividends', name: 'Dividendos' },
      { id: 'income-investments-proceeds', name: 'Rendimentos' },
    ],
  },
  {
    id: 'income-rent',
    name: 'Aluguéis recebidos',
    type: 'income',
    icon: 'key-round',
  },
  {
    id: 'income-benefits',
    name: 'Benefícios',
    type: 'income',
    icon: 'hand-heart',
  },
  {
    id: 'income-refunds',
    name: 'Reembolsos',
    type: 'income',
    icon: 'rotate-ccw',
  },
  {
    id: 'income-other',
    name: 'Outras receitas',
    type: 'income',
    icon: 'circle-ellipsis',
  },
]

export const defaultCategoryCatalog: readonly CategoryDefinition[] =
  entries.flatMap((entry) => [
    {
      id: entry.id,
      name: entry.name,
      normalizedName: normalizeCategoryName(entry.name),
      type: entry.type,
      parentCategoryId: null,
      icon: entry.icon,
    },
    ...(entry.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      normalizedName: normalizeCategoryName(child.name),
      type: entry.type,
      parentCategoryId: entry.id,
      icon: null,
    })),
  ])
