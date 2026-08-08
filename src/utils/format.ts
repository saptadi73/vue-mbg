const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const compact = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const coerceDate = (value: string | number | Date | null | undefined) => {
  if (value === null || value === undefined || value === '') return null
  const candidate = value instanceof Date ? value : new Date(value)
  return Number.isNaN(candidate.getTime()) ? null : candidate
}

export const formatCurrency = (value: number) => currency.format(value || 0)

export const formatCompact = (value: number) => compact.format(value || 0)

export const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value || 0)

export const formatDateLocal = (
  value: string | number | Date | null | undefined,
  fallback = '-',
) => {
  const dateValue = coerceDate(value)
  if (!dateValue) return fallback
  return dateFormatter.format(dateValue)
}

export const formatDateTimeLocal = (
  value: string | number | Date | null | undefined,
  fallback = '-',
) => {
  const dateValue = coerceDate(value)
  if (!dateValue) return fallback
  return dateTimeFormatter.format(dateValue)
}

export const formatDate = (value: string) => formatDateLocal(value)

export const formatDateTime = (value: string) => formatDateTimeLocal(value)
