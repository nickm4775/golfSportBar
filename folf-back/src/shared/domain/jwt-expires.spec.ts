import { parseExpiresInSeconds } from './jwt-expires';

describe('parseExpiresInSeconds', () => {
  it('parses compact duration strings', () => {
    expect(parseExpiresInSeconds('15m')).toBe(900);
    expect(parseExpiresInSeconds('7d')).toBe(604800);
    expect(parseExpiresInSeconds('30s')).toBe(30);
  });

  it('falls back on invalid values', () => {
    expect(parseExpiresInSeconds('nope', 42)).toBe(42);
    expect(parseExpiresInSeconds(undefined)).toBe(900);
  });
});
