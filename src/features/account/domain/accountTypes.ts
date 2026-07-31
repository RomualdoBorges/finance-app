export const ACCOUNT_TYPES = [
  'checking',
  'savings',
  'cash',
  'credit_card',
  'investment',
  'digital_wallet',
  'other',
] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_LABELS: Readonly<Record<AccountType, string>> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  credit_card: 'Cartão de crédito',
  investment: 'Investimento',
  digital_wallet: 'Carteira digital',
  other: 'Outra',
}

export type AccountTypeDefaults = {
  readonly includeInBalance: boolean
  readonly includeInNetWorth: boolean
}

const DEFAULTS: Readonly<Record<AccountType, AccountTypeDefaults>> = {
  checking: { includeInBalance: true, includeInNetWorth: true },
  savings: { includeInBalance: true, includeInNetWorth: true },
  cash: { includeInBalance: true, includeInNetWorth: true },
  credit_card: { includeInBalance: false, includeInNetWorth: true },
  investment: { includeInBalance: false, includeInNetWorth: true },
  digital_wallet: { includeInBalance: true, includeInNetWorth: true },
  other: { includeInBalance: true, includeInNetWorth: true },
}

export function getAccountTypeDefaults(
  accountType: AccountType,
): AccountTypeDefaults {
  return DEFAULTS[accountType]
}
