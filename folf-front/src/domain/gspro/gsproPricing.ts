/** Tarifas GSPro por persona/hora (BRL). partySize = 1 + companionCount (1–4). */
const PRICE_PER_PERSON_BY_PARTY_SIZE: Record<number, number> = {
  1: 150,
  2: 150,
  3: 130,
  4: 120,
}

export const MIN_COMPANION_COUNT = 0
export const MAX_COMPANION_COUNT = 3

export function partySizeFromCompanions(companionCount: number): number {
  return 1 + companionCount
}

export function pricePerPersonBrl(partySize: number): number {
  return PRICE_PER_PERSON_BY_PARTY_SIZE[partySize] ?? PRICE_PER_PERSON_BY_PARTY_SIZE[1]!
}

export function durationHoursFromRange(startAt: Date | string, endAt: Date | string): number {
  const start = startAt instanceof Date ? startAt : new Date(startAt)
  const end = endAt instanceof Date ? endAt : new Date(endAt)
  const ms = end.getTime() - start.getTime()
  return Math.max(ms / 3_600_000, 1 / 60)
}

export function computeReservationPreview(companionCount: number, startAt: string, endAt: string) {
  const partySize = partySizeFromCompanions(companionCount)
  const unitPriceBrl = pricePerPersonBrl(partySize)
  const hours = durationHoursFromRange(startAt, endAt)
  const totalCostBrl = Math.round(partySize * unitPriceBrl * hours * 100) / 100
  return { partySize, unitPriceBrl, hours, totalCostBrl }
}

export function formatBrl(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value)
}
