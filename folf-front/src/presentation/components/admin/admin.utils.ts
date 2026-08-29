import { OrderStatus } from '@/shared/domain/enums'

export function slugFromName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function matchesQuery(values: Array<string | null | undefined>, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return values.some((value) => (value ?? '').toLowerCase().includes(needle))
}

export function nextOrderStatuses(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case OrderStatus.DRAFT:
      return [OrderStatus.OPEN, OrderStatus.CANCELLED]
    case OrderStatus.OPEN:
      return [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED]
    case OrderStatus.IN_PROGRESS:
      return [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
    default:
      return []
  }
}

export function formatDateTime(value: string, locale: string) {
  const localeMap: Record<string, string> = {
    pt: 'pt-BR',
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT',
    zh: 'zh-CN',
  }
  return new Intl.DateTimeFormat(localeMap[locale] ?? 'pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function toDatetimeLocalValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function addMinutesToDatetimeLocal(value: string, minutes: number) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  date.setMinutes(date.getMinutes() + minutes)
  return toDatetimeLocalValue(date)
}

export function formatApiError(
  error: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
  locale: string,
) {
  if (!(error instanceof Error)) return undefined
  if (!('code' in error) || typeof error.code !== 'string' || !error.code) {
    return error.message
  }

  const details =
    'details' in error && error.details && typeof error.details === 'object'
      ? (error.details as Record<string, unknown>)
      : {}
  const startAt = typeof details.startAt === 'string' ? formatDateTime(details.startAt, locale) : ''
  const endAt = typeof details.endAt === 'string' ? formatDateTime(details.endAt, locale) : ''

  return t(`errors.${error.code}`, {
    defaultValue: error.message,
    customerName: typeof details.customerName === 'string' ? details.customerName : '',
    startAt,
    endAt,
  })
}
