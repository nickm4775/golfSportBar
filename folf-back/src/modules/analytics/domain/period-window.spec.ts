import { AnalyticsPeriod } from './analytics-period';
import {
  buildSeriesBuckets,
  isoWeekKey,
  resolvePeriodWindow,
  resolveTimeZone,
  revenueDeltaPct,
  zonedParts,
} from './period-window';

describe('period-window', () => {
  const tz = 'America/Sao_Paulo';
  const now = new Date('2026-08-18T12:00:00.000Z');

  it('falls back to America/Sao_Paulo for invalid timezones', () => {
    expect(resolveTimeZone('Not/AZone')).toBe('America/Sao_Paulo');
    expect(resolveTimeZone(null)).toBe('America/Sao_Paulo');
  });

  it('resolves daily calendar bounds in America/Sao_Paulo', () => {
    const window = resolvePeriodWindow(AnalyticsPeriod.Daily, now, tz);
    expect(window.from.toISOString()).toBe('2026-08-18T03:00:00.000Z');
    expect(window.to.toISOString()).toBe('2026-08-19T03:00:00.000Z');
    expect(window.previousFrom.toISOString()).toBe('2026-08-17T03:00:00.000Z');
    expect(window.previousTo.toISOString()).toBe('2026-08-18T03:00:00.000Z');
    expect(window.granularity).toBe('hour');
    expect(buildSeriesBuckets(window)).toHaveLength(24);
  });

  it('resolves ISO week Monday–Sunday around 18 Aug 2026', () => {
    const window = resolvePeriodWindow(AnalyticsPeriod.Weekly, now, tz);
    expect(zonedParts(now, tz).weekday).toBe('Tue');
    expect(window.from.toISOString()).toBe('2026-08-17T03:00:00.000Z');
    expect(window.to.toISOString()).toBe('2026-08-24T03:00:00.000Z');
    expect(window.previousFrom.toISOString()).toBe('2026-08-10T03:00:00.000Z');
    expect(window.granularity).toBe('day');
    expect(buildSeriesBuckets(window).map((row) => row.bucket)).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
      '2026-08-21',
      '2026-08-22',
      '2026-08-23',
    ]);
  });

  it('resolves Q3 2026 and the previous quarter', () => {
    const window = resolvePeriodWindow(AnalyticsPeriod.Quarterly, now, tz);
    expect(window.from.toISOString()).toBe('2026-07-01T03:00:00.000Z');
    expect(window.to.toISOString()).toBe('2026-10-01T03:00:00.000Z');
    expect(window.previousFrom.toISOString()).toBe('2026-04-01T03:00:00.000Z');
    expect(window.previousTo.toISOString()).toBe('2026-07-01T03:00:00.000Z');
    expect(window.granularity).toBe('week');
    const buckets = buildSeriesBuckets(window);
    expect(buckets[0]?.bucket).toBe(isoWeekKey(2026, 6, 29));
    expect(buckets.at(-1)?.bucket).toBe(isoWeekKey(2026, 9, 28));
  });

  it('resolves H2 2026 and H1 as previous', () => {
    const window = resolvePeriodWindow(AnalyticsPeriod.Semiannual, now, tz);
    expect(window.from.toISOString()).toBe('2026-07-01T03:00:00.000Z');
    expect(window.to.toISOString()).toBe('2027-01-01T03:00:00.000Z');
    expect(window.previousFrom.toISOString()).toBe('2026-01-01T03:00:00.000Z');
    expect(window.granularity).toBe('month');
    expect(buildSeriesBuckets(window).map((row) => row.bucket)).toEqual([
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ]);
  });

  it('resolves calendar year 2026', () => {
    const window = resolvePeriodWindow(AnalyticsPeriod.Annual, now, tz);
    expect(window.from.toISOString()).toBe('2026-01-01T03:00:00.000Z');
    expect(window.to.toISOString()).toBe('2027-01-01T03:00:00.000Z');
    expect(window.previousFrom.toISOString()).toBe('2025-01-01T03:00:00.000Z');
    expect(buildSeriesBuckets(window)).toHaveLength(12);
    expect(buildSeriesBuckets(window)[0]?.bucket).toBe('2026-01');
    expect(buildSeriesBuckets(window)[11]?.bucket).toBe('2026-12');
  });

  it('computes revenue deltas', () => {
    expect(revenueDeltaPct(0, 0)).toBe(0);
    expect(revenueDeltaPct(120, 0)).toBe(100);
    expect(revenueDeltaPct(150, 100)).toBe(50);
    expect(revenueDeltaPct(80, 100)).toBe(-20);
  });
});
