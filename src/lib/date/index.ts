import { endOfMonth, format, isValid, startOfMonth, toDate } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type DateInput = Date | number

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
