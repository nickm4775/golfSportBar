import { apiRequest } from '@/infrastructure/http/apiClient'
import {
  DEFAULT_ANALYTICS_PERIOD,
  type AnalyticsPeriod,
  type DashboardSummary,
  type IAnalyticsRepository,
} from '@/domain/analytics/DashboardSummary'

export class HttpAnalyticsRepository implements IAnalyticsRepository {
  getSummary(businessId: string, period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD) {
    return apiRequest<DashboardSummary>(
      `/businesses/${businessId}/analytics/summary?period=${period}`,
      { businessId },
    )
  }
}
