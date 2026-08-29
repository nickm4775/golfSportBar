import { zonedDayRange } from './zoned-day';

describe('zonedDayRange', () => {
  it('maps a Sao Paulo calendar day to UTC-3 bounds', () => {
    const { start, end } = zonedDayRange('2026-08-18', 'America/Sao_Paulo');
    expect(start.toISOString()).toBe('2026-08-18T03:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-19T03:00:00.000Z');
  });

  it('rejects malformed dates', () => {
    expect(() => zonedDayRange('18/08/2026', 'UTC')).toThrow('Date must be YYYY-MM-DD');
  });
});
