import { endOfMonth, format, isValid, startOfMonth, toDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type DateInput = Date | number

export const CIVIL_DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/

/** Valida uma data civil sem criar Date nem aplicar timezone. */
export const isValidCivilDate = (value: string): boolean => {
  if (!CIVIL_DATE_PATTERN.test(value)) return false
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  return day >= 1 && day <= (daysInMonth[month - 1] ?? 0)
}

/** Retorna hoje como data civil YYYY-MM-DD usando o calendário local. */
export const getTodayCivilDate = (now = new Date()): string => {
  const year = String(now.getFullYear()).padStart(4, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Formata uma data civil válida sem conversão de timezone. */
export const formatCivilDateBR = (value: string): string => {
  if (!isValidCivilDate(value))
    throw new RangeError('A data informada é inválida.')
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

const toValidDate = (date: DateInput): Date => {
  const parsedDate = toDate(date)

  if (!isValid(parsedDate)) {
    throw new RangeError('A data informada é inválida.')
  }

  return parsedDate
}

/** Formata uma data válida no calendário local como dd/MM/aaaa. */
export const formatDateBR = (date: DateInput): string =>
  format(toValidDate(date), 'dd/MM/yyyy', { locale: ptBR })

/** Formata uma data válida no calendário local como "janeiro de 2026". */
export const formatMonthYearBR = (date: DateInput): string =>
  format(toValidDate(date), "MMMM 'de' yyyy", { locale: ptBR })

/** Retorna o início do mês da data no calendário local. */
export const getMonthStart = (date: DateInput): Date =>
  startOfMonth(toValidDate(date))

/** Retorna o fim do mês da data no calendário local. */
export const getMonthEnd = (date: DateInput): Date =>
  endOfMonth(toValidDate(date))

/** Cria a chave mensal YYYY-MM usando o calendário local. */
export const getMonthKey = (date: DateInput): string =>
  format(toValidDate(date), 'yyyy-MM')
