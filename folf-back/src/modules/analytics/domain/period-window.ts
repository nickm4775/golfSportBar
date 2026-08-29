import {
  AnalyticsPeriod,
  DEFAULT_BUSINESS_TIMEZONE,
  type SeriesGranularity,
} from './analytics-period';

export interface ZonedDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
}

export interface PeriodWindow {
  period: AnalyticsPeriod;
  timezone: string;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  granularity: SeriesGranularity;
}

export interface SeriesBucket {
  bucket: string;
  label: string;
  from: Date;
  to: Date;
}

const WEEKDAY_TO_ISO: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export function resolveTimeZone(timezone?: string | null): string {
  const candidate = timezone?.trim() || DEFAULT_BUSINESS_TIMEZONE;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return DEFAULT_BUSINESS_TIMEZONE;
  }
}

export function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - date.getTime();
}

export function zonedLocalToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const offset = getTimeZoneOffsetMs(timeZone, new Date(utcGuess));
  const instant = new Date(utcGuess - offset);
  const offset2 = getTimeZoneOffsetMs(timeZone, instant);
  if (offset2 !== offset) {
    return new Date(utcGuess - offset2);
  }
  return instant;
}

export function zonedParts(date: Date, timeZone: string): ZonedDateParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: get('weekday'),
  };
}

export function startOfZonedDay(date: Date, timeZone: string): Date {
  const parts = zonedParts(date, timeZone);
  return zonedLocalToUtc(timeZone, parts.year, parts.month, parts.day);
}

export function addZonedCalendarDays(
  date: Date,
  timeZone: string,
  days: number,
): Date {
  const parts = zonedParts(date, timeZone);
  const tmp = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days, parts.hour, parts.minute, parts.second),
  );
  return zonedLocalToUtc(
    timeZone,
    tmp.getUTCFullYear(),
    tmp.getUTCMonth() + 1,
    tmp.getUTCDate(),
    tmp.getUTCHours(),
    tmp.getUTCMinutes(),
    tmp.getUTCSeconds(),
  );
}

export function addZonedCalendarMonths(
  date: Date,
  timeZone: string,
  months: number,
): Date {
  const parts = zonedParts(date, timeZone);
  const tmp = new Date(
    Date.UTC(parts.year, parts.month - 1 + months, parts.day, parts.hour, parts.minute, parts.second),
  );
  return zonedLocalToUtc(
    timeZone,
    tmp.getUTCFullYear(),
    tmp.getUTCMonth() + 1,
    tmp.getUTCDate(),
    tmp.getUTCHours(),
    tmp.getUTCMinutes(),
    tmp.getUTCSeconds(),
  );
}

export function startOfIsoWeek(date: Date, timeZone: string): Date {
  const start = startOfZonedDay(date, timeZone);
  const parts = zonedParts(start, timeZone);
  const isoDay = WEEKDAY_TO_ISO[parts.weekday] ?? 1;
  return addZonedCalendarDays(start, timeZone, 1 - isoDay);
}

export function isoWeekKey(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  const utcDay = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - utcDay);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function hourKey(year: number, month: number, day: number, hour: number): string {
  return `${dayKey(year, month, day)}T${pad2(hour)}:00`;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

export function granularityFor(period: AnalyticsPeriod): SeriesGranularity {
  switch (period) {
    case AnalyticsPeriod.Daily:
      return 'hour';
    case AnalyticsPeriod.Weekly:
      return 'day';
    case AnalyticsPeriod.Quarterly:
      return 'week';
    case AnalyticsPeriod.Semiannual:
    case AnalyticsPeriod.Annual:
      return 'month';
    default:
      return 'day';
  }
}

export function resolvePeriodWindow(
  period: AnalyticsPeriod,
  now: Date,
  timezoneInput?: string | null,
): PeriodWindow {
  const timezone = resolveTimeZone(timezoneInput);
  const parts = zonedParts(now, timezone);
  const granularity = granularityFor(period);

  let from: Date;
  let to: Date;
  let previousFrom: Date;
  let previousTo: Date;

  switch (period) {
    case AnalyticsPeriod.Daily: {
      from = zonedLocalToUtc(timezone, parts.year, parts.month, parts.day);
      to = addZonedCalendarDays(from, timezone, 1);
      previousFrom = addZonedCalendarDays(from, timezone, -1);
      previousTo = from;
      break;
    }
    case AnalyticsPeriod.Weekly: {
      from = startOfIsoWeek(now, timezone);
      to = addZonedCalendarDays(from, timezone, 7);
      previousFrom = addZonedCalendarDays(from, timezone, -7);
      previousTo = from;
      break;
    }
    case AnalyticsPeriod.Quarterly: {
      const quarterStartMonth = Math.floor((parts.month - 1) / 3) * 3 + 1;
      from = zonedLocalToUtc(timezone, parts.year, quarterStartMonth, 1);
      to = addZonedCalendarMonths(from, timezone, 3);
      previousFrom = addZonedCalendarMonths(from, timezone, -3);
      previousTo = from;
      break;
    }
    case AnalyticsPeriod.Semiannual: {
      const halfStartMonth = parts.month <= 6 ? 1 : 7;
      from = zonedLocalToUtc(timezone, parts.year, halfStartMonth, 1);
      to = addZonedCalendarMonths(from, timezone, 6);
      previousFrom = addZonedCalendarMonths(from, timezone, -6);
      previousTo = from;
      break;
    }
    case AnalyticsPeriod.Annual: {
      from = zonedLocalToUtc(timezone, parts.year, 1, 1);
      to = zonedLocalToUtc(timezone, parts.year + 1, 1, 1);
      previousFrom = zonedLocalToUtc(timezone, parts.year - 1, 1, 1);
      previousTo = from;
      break;
    }
    default: {
      from = zonedLocalToUtc(timezone, parts.year, parts.month, parts.day);
      to = addZonedCalendarDays(from, timezone, 1);
      previousFrom = addZonedCalendarDays(from, timezone, -1);
      previousTo = from;
    }
  }

  return {
    period,
    timezone,
    from,
    to,
    previousFrom,
    previousTo,
    granularity,
  };
}

export function buildSeriesBuckets(window: PeriodWindow): SeriesBucket[] {
  const { timezone, from, to, granularity } = window;
  const buckets: SeriesBucket[] = [];

  if (granularity === 'hour') {
    let cursor = from;
    while (cursor < to) {
      const parts = zonedParts(cursor, timezone);
      const hourStart = zonedLocalToUtc(
        timezone,
        parts.year,
        parts.month,
        parts.day,
        parts.hour,
      );
      const hourEnd = zonedLocalToUtc(
        timezone,
        parts.year,
        parts.month,
        parts.day,
        parts.hour + 1,
      );
      const key = hourKey(parts.year, parts.month, parts.day, parts.hour);
      buckets.push({ bucket: key, label: key, from: hourStart, to: hourEnd });
      cursor = hourEnd > cursor ? hourEnd : new Date(cursor.getTime() + 60 * 60 * 1000);
      if (buckets.length > 48) break;
    }
    return buckets;
  }

  if (granularity === 'day') {
    let cursor = startOfZonedDay(from, timezone);
    if (cursor < from) cursor = from;
    cursor = startOfZonedDay(from, timezone);
    while (cursor < to) {
      const parts = zonedParts(cursor, timezone);
      const next = addZonedCalendarDays(cursor, timezone, 1);
      const key = dayKey(parts.year, parts.month, parts.day);
      buckets.push({ bucket: key, label: key, from: cursor, to: next });
      cursor = next;
    }
    return buckets;
  }

  if (granularity === 'week') {
    let cursor = startOfIsoWeek(from, timezone);
    while (cursor < to) {
      const parts = zonedParts(cursor, timezone);
      const next = addZonedCalendarDays(cursor, timezone, 7);
      const key = isoWeekKey(parts.year, parts.month, parts.day);
      buckets.push({ bucket: key, label: key, from: cursor, to: next });
      cursor = next;
    }
    return buckets;
  }

  let cursor = zonedLocalToUtc(
    timezone,
    zonedParts(from, timezone).year,
    zonedParts(from, timezone).month,
    1,
  );
  while (cursor < to) {
    const parts = zonedParts(cursor, timezone);
    const next = addZonedCalendarMonths(cursor, timezone, 1);
    const key = monthKey(parts.year, parts.month);
    buckets.push({ bucket: key, label: key, from: cursor, to: next });
    cursor = next;
  }
  return buckets;
}

export function revenueDeltaPct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
