/** Tarifas GSPro por persona/hora (BRL). partySize = 1 + companionCount (1–4). */
const PRICE_PER_PERSON_BY_PARTY_SIZE: Record<number, number> = {
  1: 150,
  2: 150,
  3: 130,
  4: 120,
};

export const MIN_COMPANION_COUNT = 0;
export const MAX_COMPANION_COUNT = 3;

export function partySizeFromCompanions(companionCount: number): number {
  return 1 + companionCount;
}

export function assertCompanionCount(companionCount: number): void {
  if (
    !Number.isInteger(companionCount) ||
    companionCount < MIN_COMPANION_COUNT ||
    companionCount > MAX_COMPANION_COUNT
  ) {
    throw new Error(
      `companionCount must be an integer between ${MIN_COMPANION_COUNT} and ${MAX_COMPANION_COUNT}`,
    );
  }
}

export function pricePerPersonBrl(partySize: number): number {
  const price = PRICE_PER_PERSON_BY_PARTY_SIZE[partySize];
  if (price === undefined) {
    throw new Error('partySize must be between 1 and 4');
  }
  return price;
}

export function durationHoursFromRange(startAt: Date, endAt: Date): number {
  const ms = endAt.getTime() - startAt.getTime();
  return Math.max(ms / 3_600_000, 1 / 60);
}

export function durationHoursFromMinutes(durationMinutes: number): number {
  return Math.max(durationMinutes, 1) / 60;
}

export function computeTotalCostBrl(input: {
  companionCount: number;
  durationHours: number;
}): { partySize: number; unitPriceBrl: number; totalCostBrl: number } {
  assertCompanionCount(input.companionCount);
  const partySize = partySizeFromCompanions(input.companionCount);
  const unitPriceBrl = pricePerPersonBrl(partySize);
  const totalCostBrl = Math.round(partySize * unitPriceBrl * input.durationHours * 100) / 100;
  return { partySize, unitPriceBrl, totalCostBrl };
}

export function pricingForReservationRange(
  companionCount: number,
  startAt: Date,
  endAt: Date,
) {
  return computeTotalCostBrl({
    companionCount,
    durationHours: durationHoursFromRange(startAt, endAt),
  });
}

export function pricingForSessionDuration(
  companionCount: number,
  durationMinutes: number,
) {
  return computeTotalCostBrl({
    companionCount,
    durationHours: durationHoursFromMinutes(durationMinutes),
  });
}
