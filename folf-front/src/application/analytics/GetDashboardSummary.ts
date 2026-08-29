import type { AnalyticsPeriod, IAnalyticsRepository } from '@/domain/analytics/DashboardSummary'

export class GetDashboardSummary {
  private readonly analyticsRepository: IAnalyticsRepository

  constructor(analyticsRepository: IAnalyticsRepository) {
    this.analyticsRepository = analyticsRepository
  }

  execute(businessId: string, period?: AnalyticsPeriod) {
    return this.analyticsRepository.getSummary(businessId, period)
  }
}
