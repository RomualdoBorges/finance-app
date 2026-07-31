export const MIN_MONEY_MINOR = -9_000_000_000_000
export const MAX_MONEY_MINOR = 9_000_000_000_000

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function validateMinorAmount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= MIN_MONEY_MINOR &&
    value <= MAX_MONEY_MINOR
  )
}

export function parseCurrencyToMinor(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/^R\$\s*/i, '')
    .replace(/\s/g, '')

  if (normalized.length === 0) return null

  const match = /^([+-]?)(?:(\d{1,3}(?:\.\d{3})+)|(\d+))(?:,(\d{1,2}))?$/.exec(
    normalized,
  )
  if (match === null) return null

  const sign = match[1] === '-' ? -1 : 1
  const whole = (match[2] ?? match[3] ?? '').replace(/\./g, '')
  const cents = (match[4] ?? '').padEnd(2, '0')
  const minor = sign * (Number(whole) * 100 + Number(cents))
  return validateMinorAmount(minor) ? minor : null
}

export function formatMinorToCurrency(value: number): string {
  if (!validateMinorAmount(value))
    throw new RangeError('O valor monetário em centavos é inválido.')
  return currencyFormatter.format(value / 100)
}
