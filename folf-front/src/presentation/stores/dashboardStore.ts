import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import {
  DEFAULT_ANALYTICS_PERIOD,
  type AnalyticsPeriod,
  type DashboardSummary,
} from '@/domain/analytics/DashboardSummary'

interface DashboardState {
  summary: DashboardSummary | null
  period: AnalyticsPeriod
  loadedBusinessId: string | null
  loading: boolean
  error: string | null
  setPeriod: (period: AnalyticsPeriod) => void
  load: (period?: AnalyticsPeriod) => Promise<void>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  summary: null,
  period: DEFAULT_ANALYTICS_PERIOD,
  loadedBusinessId: null,
  loading: false,
  error: null,

  setPeriod(period) {
    set({ period })
  },

  async load(period) {
    const businessId = requireBusinessId()
    const nextPeriod = period ?? get().period
    set({
      loading: true,
      error: null,
      period: nextPeriod,
      summary:
        get().loadedBusinessId === businessId && get().summary?.period === nextPeriod
          ? get().summary
          : null,
    })

    try {
      const summary = await services.getDashboardSummary.execute(businessId, nextPeriod)
      set({
        summary,
        loading: false,
        loadedBusinessId: businessId,
        period: summary.period,
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
}))
