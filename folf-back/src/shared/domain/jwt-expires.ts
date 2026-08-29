const MATCH = /^(\d+)([smhd])$/i;

export function parseExpiresInSeconds(value: string | undefined, fallback = 900): number {
  if (!value) return fallback;
  const match = MATCH.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * (multipliers[unit] ?? 1);
}
