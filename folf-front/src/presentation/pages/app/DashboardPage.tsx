import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '@/app/providers/ThemeProvider'
import { formatBrl } from '@/shared/lib/formatBrl'
import { useAuthStore } from '@/presentation/stores/authStore'
import { useDashboardStore } from '@/presentation/stores/dashboardStore'
import { useRealtimeStore } from '@/presentation/stores/realtimeStore'
import {
  EmptyState,
  ErrorBanner,
  FilterSelect,
  PageHeader,
  StatusBadge,
} from '@/presentation/components/admin/AdminUi'
import { formatDateTime } from '@/presentation/components/admin/admin.utils'
import {
  ANALYTICS_PERIODS,
  type AnalyticsPeriod,
  type SeriesGranularity,
} from '@/domain/analytics/DashboardSummary'

const STATUS_BAR_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  OPEN: '#f59e0b',
  IN_PROGRESS: '#38bdf8',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
}

function localeTag(locale: string) {
  const map: Record<string, string> = {
    pt: 'pt-BR',
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT',
    zh: 'zh-CN',
  }
  return map[locale] ?? 'pt-BR'
}

function formatRange(from: string, to: string, locale: string, timeZone: string) {
  const start = new Date(from)
  const end = new Date(new Date(to).getTime() - 1)
  const fmt = new Intl.DateTimeFormat(localeTag(locale), {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

function formatBucket(bucket: string, granularity: SeriesGranularity, locale: string) {
  const tag = localeTag(locale)
  if (granularity === 'hour') {
    const time = bucket.split('T')[1] ?? bucket
    return time.slice(0, 5)
  }
  if (granularity === 'day') {
    return new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric' }).format(
      new Date(`${bucket}T12:00:00`),
    )
  }
  if (granularity === 'week') {
    return bucket.replace('-W', ' W')
  }
  const [year, month] = bucket.split('-')
  if (!year || !month) return bucket
  return new Intl.DateTimeFormat(tag, { month: 'short', year: 'numeric' }).format(
    new Date(Number(year), Number(month) - 1, 1),
  )
}

function useChartColors() {
  const { theme } = useTheme()
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement)
    const accentFallback = theme === 'dark' ? '#3db56a' : '#1f6b3a'
    return {
      accent: styles.getPropertyValue('--gsb-accent').trim() || accentFallback,
      muted: styles.getPropertyValue('--gsb-muted').trim() || '#5a6b60',
      fg: styles.getPropertyValue('--gsb-fg').trim() || '#143528',
      grid: styles.getPropertyValue('--gsb-border').trim() || 'rgba(20,53,40,0.1)',
    }
  }, [theme])
}

function Delta({ value, label }: { value: number; label: string }) {
  const positive = value > 0
  const negative = value < 0
  const tone = positive
    ? 'text-emerald-700 dark:text-emerald-300'
    : negative
      ? 'text-red-700 dark:text-red-300'
      : 'text-[var(--gsb-muted)]'
  const prefix = positive ? '↑ ' : negative ? '↓ ' : ''
  return (
    <p className={`mt-2 text-xs font-medium ${tone}`}>
      {prefix}
      {Math.abs(value)}% {label}
    </p>
  )
}

function KpiSkeleton() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]"
        />
      ))}
    </section>
  )
}

export function DashboardPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const summary = useDashboardStore((state) => state.summary)
  const period = useDashboardStore((state) => state.period)
  const loading = useDashboardStore((state) => state.loading)
  const error = useDashboardStore((state) => state.error)
  const load = useDashboardStore((state) => state.load)
  const user = useAuthStore((state) => state.user)
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const setActiveBusiness = useAuthStore((state) => state.setActiveBusiness)
  const live = useRealtimeStore((state) => state.connected)
  const colors = useChartColors()
  const businesses = user?.businesses ?? []

  useEffect(() => {
    if (activeBusinessId) void load(period)
  }, [load, activeBusinessId, period])

  const periodOptions = ANALYTICS_PERIODS.map((id) => ({
    id,
    label: t(`periods.${id}`),
  }))
  const businessOptions = businesses.map((business) => ({
    id: business.id,
    label: business.name,
  }))

  const kpis = summary
    ? [
        {
          key: 'revenuePeriod',
          value: formatBrl(summary.revenuePeriodBrl, locale),
          delta: summary.revenueDeltaPct,
        },
        {
          key: 'averageTicket',
          value: formatBrl(summary.averageTicketBrl, locale),
        },
        { key: 'ordersCompleted', value: String(summary.ordersCompleted) },
        { key: 'ordersOpen', value: String(summary.ordersOpen) },
        { key: 'sessionsActive', value: String(summary.sessionsActive) },
        { key: 'reservationsInPeriod', value: String(summary.reservationsInPeriod) },
      ]
    : []

  const hasRevenue = (summary?.revenueSeries ?? []).some((row) => row.revenueBrl > 0)
  const chartData =
    summary?.revenueSeries.map((row) => ({
      ...row,
      tick: formatBucket(row.bucket, summary.granularity, locale),
    })) ?? []

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label={t('dashboard.business')}
            value={activeBusinessId ?? ''}
            onChange={setActiveBusiness}
            options={businessOptions}
          />
          <FilterSelect
            label={t('dashboard.period')}
            value={period}
            onChange={(value) => useDashboardStore.getState().setPeriod(value as AnalyticsPeriod)}
            options={periodOptions}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--gsb-muted)]">
          {summary ? (
            <p>
              {formatRange(summary.from, summary.to, locale, summary.timezone)}
              <span className="mx-2">·</span>
              {summary.timezone}
            </p>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`size-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-[var(--gsb-muted)]'}`}
            />
            {live ? t('dashboard.live') : t('dashboard.offline')}
          </span>
        </div>
      </div>

      {error ? (
        <ErrorBanner
          message={error}
          onRetry={() => void load(period)}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {loading && !summary ? <KpiSkeleton /> : null}

      {summary ? (
        <div className={loading ? 'opacity-70 transition' : ''}>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.map((kpi) => (
              <article
                key={kpi.key}
                className="rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4 shadow-[0_8px_30px_-18px_var(--gsb-glow)]"
              >
                <p className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
                  {t(`kpis.${kpi.key}`)}
                </p>
                <p className="mt-2 font-display text-3xl tracking-tight">{kpi.value}</p>
                {'delta' in kpi && kpi.delta != null ? (
                  <Delta value={kpi.delta} label={t('dashboard.vsPrevious')} />
                ) : (
                  <p className="mt-2 text-xs text-[var(--gsb-muted)]">{t(`periods.${period}`)}</p>
                )}
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-4 xl:grid-cols-5">
            <article className="rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4 xl:col-span-3">
              <h2 className="mb-4 text-sm font-medium">{t('charts.revenueTitle')}</h2>
              {hasRevenue ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gsbRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.accent} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={colors.accent} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="tick"
                        tick={{ fill: colors.muted, fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: colors.muted, fontSize: 11 }}
                        tickFormatter={(value: number) => formatBrl(Number(value), locale)}
                        width={88}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--gsb-surface)',
                          border: '1px solid var(--gsb-border)',
                          borderRadius: 12,
                          color: colors.fg,
                        }}
                        formatter={(value, name) =>
                          name === 'revenueBrl'
                            ? [formatBrl(Number(value), locale), t('charts.revenue')]
                            : [value, t('charts.orders')]
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenueBrl"
                        stroke={colors.accent}
                        strokeWidth={2}
                        fill="url(#gsbRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message={t('charts.empty')} />
              )}
            </article>

            <article className="rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4 xl:col-span-2">
              <h2 className="mb-4 text-sm font-medium">{t('charts.statusTitle')}</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.ordersByStatus}>
                    <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tick={{ fill: colors.muted, fontSize: 10 }}
                      tickFormatter={(value: string) => t(`status.${value}`)}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: colors.muted, fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--gsb-surface)',
                        border: '1px solid var(--gsb-border)',
                        borderRadius: 12,
                      }}
                      formatter={(value) => [value, t('charts.orders')]}
                      labelFormatter={(label) => t(`status.${String(label)}`)}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {summary.ordersByStatus.map((row) => (
                        <Cell
                          key={row.status}
                          fill={STATUS_BAR_COLORS[row.status] ?? colors.accent}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium">{t('recent.title')}</h2>
              <Link
                to="/app/orders"
                className="text-xs text-[var(--gsb-accent)] hover:underline"
              >
                {t('recent.viewAll')}
              </Link>
            </div>
            {summary.recentOrders.length === 0 ? (
              <EmptyState message={t('recent.empty')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
                    <tr>
                      <th className="pb-2">{t('recent.table')}</th>
                      <th className="pb-2">{t('orders.changeStatus')}</th>
                      <th className="pb-2">{t('recent.total')}</th>
                      <th className="pb-2">{t('recent.when')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentOrders.map((order) => (
                      <tr key={order.id} className="border-t border-[var(--gsb-border)]">
                        <td className="py-3">{order.tableLabel ?? '—'}</td>
                        <td>
                          <StatusBadge
                            label={t(`status.${order.status}`)}
                            status={order.status}
                          />
                        </td>
                        <td>{formatBrl(order.totalBrl, locale)}</td>
                        <td className="text-[var(--gsb-muted)]">
                          {formatDateTime(order.createdAt, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
