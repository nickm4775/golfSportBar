export enum AnalyticsPeriod {
  Daily = 'daily',
  Weekly = 'weekly',
  Quarterly = 'quarterly',
  Semiannual = 'semiannual',
  Annual = 'annual',
}

export type SeriesGranularity = 'hour' | 'day' | 'week' | 'month';

export const ANALYTICS_PERIODS = Object.values(AnalyticsPeriod);

export const DEFAULT_ANALYTICS_PERIOD = AnalyticsPeriod.Daily;
export const DEFAULT_BUSINESS_TIMEZONE = 'America/Sao_Paulo';
