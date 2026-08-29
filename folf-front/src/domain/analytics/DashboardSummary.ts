import type { OrderStatus } from '@/shared/domain/enums'

export type AnalyticsPeriod = 'daily' | 'weekly' | 'quarterly' | 'semiannual' | 'annual'
export type SeriesGranularity = 'hour' | 'day' | 'week' | 'month'

export const ANALYTICS_PERIODS: AnalyticsPeriod[] = [
  'daily',
  'weekly',
  'quarterly',
  'semiannual',
  'annual',
]

export const DEFAULT_ANALYTICS_PERIOD: AnalyticsPeriod = 'daily'

export interface RevenueSeriesPoint {
  bucket: string
  label: string
  revenueBrl: number
  ordersCount: number
}

export interface OrdersByStatus {
  status: OrderStatus
  count: number
}

export interface RecentOrder {
  id: string
  tableLabel: string | null
  status: OrderStatus
  totalBrl: number
  createdAt: string
}

export interface DashboardSummary {
  period: AnalyticsPeriod
  timezone: string
  granularity: SeriesGranularity
  from: string
  to: string
  previousFrom: string
  previousTo: string
  revenuePeriodBrl: number
  revenuePreviousPeriodBrl: number
  revenueDeltaPct: number
  ordersCompleted: number
  averageTicketBrl: number
  reservationsInPeriod: number
  ordersOpen: number
  sessionsActive: number
  revenueSeries: RevenueSeriesPoint[]
  ordersByStatus: OrdersByStatus[]
  recentOrders: RecentOrder[]
}

export interface IAnalyticsRepository {
  getSummary(businessId: string, period?: AnalyticsPeriod): Promise<DashboardSummary>
}
