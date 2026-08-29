import { DomainException } from './domain.exception';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function offsetMsAt(instant: Date, timeZone: string): number {
  const formatted = instant.toLocaleString('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  });
  const match = formatted.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? '0');
  return sign * (hours * 3600 + minutes * 60) * 1000;
}

export function zonedDayRange(date: string, timeZone: string): { start: Date; end: Date } {
  if (!DATE_RE.test(date)) {
    throw new DomainException('Date must be YYYY-MM-DD', 'INVALID_DATE');
  }

  const noonUtc = new Date(`${date}T12:00:00.000Z`);
  const offset = offsetMsAt(noonUtc, timeZone);
  const start = new Date(Date.parse(`${date}T00:00:00.000Z`) - offset);

  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const nextDate = next.toISOString().slice(0, 10);
  const nextNoon = new Date(`${nextDate}T12:00:00.000Z`);
  const nextOffset = offsetMsAt(nextNoon, timeZone);
  const end = new Date(Date.parse(`${nextDate}T00:00:00.000Z`) - nextOffset);

  return { start, end };
}
