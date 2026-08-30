import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Funnel, Xmark } from '@gravity-ui/icons'
import { ReservationStatus, SessionStatus } from '@/shared/domain/enums'
import type { Session } from '@/domain/gspro/Gspro'
import {
  MAX_COMPANION_COUNT,
  MIN_COMPANION_COUNT,
  formatBrl,
} from '@/domain/gspro/gsproPricing'
import { useGsproStore } from '@/presentation/stores/gsproStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { formatDateTime, matchesQuery } from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'
import {
  EmptyState,
  ErrorBanner,
  IconButton,
  ListToolbar,
  Modal,
  PageHeader,
  PaginationBar,
  StatusBadge,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'

type ViewMode = 'table' | 'schedule'

const VIEW_STORAGE_KEY = 'gsb.sessions.viewMode'
const SCHEDULE_START_HOUR = 8
const SCHEDULE_END_HOUR = 24

function readStoredView(): ViewMode {
  try {
    const value = sessionStorage.getItem(VIEW_STORAGE_KEY)
    return value === 'schedule' ? 'schedule' : 'table'
  } catch {
    return 'table'
  }
}

function toDayKey(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function minutesFromDayStart(iso: string, dayKey: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  void dayKey
  return hour * 60 + minute
}

export function SessionsPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const currencyLocale = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-BR' : 'en-US'
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const sessions = useGsproStore((state) => state.sessions)
  const bays = useGsproStore((state) => state.bays)
  const reservations = useGsproStore((state) => state.reservations)
  const loading = useGsproStore((state) => state.loading)
  const error = useGsproStore((state) => state.error)
  const loadSessions = useGsproStore((state) => state.loadSessions)
  const createWalkIn = useGsproStore((state) => state.createWalkIn)
  const checkIn = useGsproStore((state) => state.checkIn)
  const updateSession = useGsproStore((state) => state.updateSession)
  const canManage = useAuthStore((state) => state.hasPermission('gspro:sessions:manage'))
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const [statusFilter, setStatusFilter] = useState<SessionStatus | ''>('')
  const [search, setSearch] = useState('')
  const [walkInOpen, setWalkInOpen] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredView)
  const [scheduleDay, setScheduleDay] = useState(() => toDayKey(new Date().toISOString(), timeZone))

  useEffect(() => {
    if (activeBusinessId) void loadSessions(statusFilter || undefined)
  }, [loadSessions, statusFilter, activeBusinessId])

  useEffect(() => {
    try {
      sessionStorage.setItem(VIEW_STORAGE_KEY, viewMode)
    } catch {
      /* ignore */
    }
  }, [viewMode])

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === ReservationStatus.CONFIRMED,
  )

  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        matchesQuery(
          [session.bay?.code, session.status, session.notes, String(session.companionCount)],
          search,
        ),
      ),
    [sessions, search],
  )
  const pageState = usePagination(filtered, `${search}:${statusFilter}:${activeBusinessId ?? ''}`)

  const scheduleSessions = useMemo(
    () =>
      filtered.filter((session) => toDayKey(session.startedAt, timeZone) === scheduleDay),
    [filtered, scheduleDay, timeZone],
  )

  const totalMinutes = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60

  return (
    <div>
      <PageHeader
        title={t('sessions.title')}
        subtitle={t('sessions.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-0.5">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'table'
                    ? 'bg-[var(--gsb-accent)] text-white'
                    : 'text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)]'
                }`}
                onClick={() => setViewMode('table')}
              >
                {t('sessions.viewTable')}
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  viewMode === 'schedule'
                    ? 'bg-[var(--gsb-accent)] text-white'
                    : 'text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)]'
                }`}
                onClick={() => setViewMode('schedule')}
              >
                {t('sessions.viewSchedule')}
              </button>
            </div>
            {canManage ? (
              <>
                <button type="button" className={primaryButtonClass} onClick={() => setWalkInOpen(true)}>
                  {t('sessions.walkIn')}
                </button>
                <button type="button" className={ghostButtonClass} onClick={() => setCheckInOpen(true)}>
                  {t('reservations.checkIn')}
                </button>
              </>
            ) : null}
          </div>
        }
      />
      {error ? (
        <ErrorBanner
          message={error}
          onRetry={() => void loadSessions(statusFilter || undefined)}
          retryLabel={t('common.retry')}
        />
      ) : null}

      <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')}>
        <label className="text-xs text-[var(--gsb-muted)]">
          <span className="mb-1 inline-flex items-center gap-1">
            <Funnel className="size-3.5" />
            {t('common.filter')}
          </span>
          <select
            className={`${inputClass} mt-1 w-auto min-w-40`}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as SessionStatus | '')}
          >
            <option value="">{t('common.all')}</option>
            {Object.values(SessionStatus).map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
        {viewMode === 'schedule' ? (
          <label className="text-xs text-[var(--gsb-muted)]">
            {t('sessions.scheduleDay')}
            <input
              className={`${inputClass} mt-1 w-auto`}
              type="date"
              value={scheduleDay}
              onChange={(event) => setScheduleDay(event.target.value)}
            />
          </label>
        ) : null}
      </ListToolbar>

      {loading && sessions.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : viewMode === 'schedule' ? (
        <SessionsSchedule
          bays={bays.filter((bay) => bay.isActive)}
          sessions={scheduleSessions}
          dayKey={scheduleDay}
          timeZone={timeZone}
          totalMinutes={totalMinutes}
          locale={locale}
          currencyLocale={currencyLocale}
        />
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
                <tr>
                  <th className="px-4 py-3">{t('reservations.bay')}</th>
                  <th>{t('sessions.started')}</th>
                  <th>{t('sessions.ended')}</th>
                  <th>{t('sessions.duration')}</th>
                  <th>{t('sessions.companions')}</th>
                  <th>{t('sessions.totalCost')}</th>
                  <th>{t('orders.changeStatus')}</th>
                  <th className="px-4">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pageState.items.map((session) => (
                  <tr key={session.id} className="border-t border-[var(--gsb-border)]">
                    <td className="px-4 py-3">{session.bay?.code ?? session.bayId.slice(0, 8)}</td>
                    <td>{formatDateTime(session.startedAt, locale)}</td>
                    <td>{session.endedAt ? formatDateTime(session.endedAt, locale) : '—'}</td>
                    <td>
                      {session.durationMinutes != null
                        ? t('sessions.minutesShort', { count: session.durationMinutes })
                        : '—'}
                    </td>
                    <td>{session.companionCount}</td>
                    <td>
                      {session.totalCostBrl != null
                        ? formatBrl(Number(session.totalCostBrl), currencyLocale)
                        : '—'}
                    </td>
                    <td>
                      <StatusBadge label={t(`status.${session.status}`)} />
                    </td>
                    <td className="px-4 py-3">
                      {canManage && session.status === SessionStatus.ACTIVE ? (
                        <div className="flex flex-wrap gap-2">
                          <IconButton
                            label={t('sessions.close')}
                            onClick={() => {
                              void updateSession(session.id, SessionStatus.COMPLETED)
                                .then(() => notify({ title: t('toast.updated') }))
                                .catch((error) => notifyError(t('toast.error'), error))
                            }}
                          >
                            <Check className="size-4" />
                          </IconButton>
                          <IconButton
                            label={t('status.CANCELLED')}
                            tone="danger"
                            onClick={() => {
                              void updateSession(session.id, SessionStatus.CANCELLED)
                                .then(() => notify({ title: t('toast.updated') }))
                                .catch((error) => notifyError(t('toast.error'), error))
                            }}
                          >
                            <Xmark className="size-4" />
                          </IconButton>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar
            page={pageState.page}
            totalPages={pageState.totalPages}
            total={pageState.total}
            pageLabel={t('common.page', { current: pageState.page, total: pageState.totalPages })}
            previousLabel={t('common.previous')}
            nextLabel={t('common.next')}
            onPageChange={pageState.setPage}
          />
        </>
      )}

      {walkInOpen ? (
        <WalkInModal
          bays={bays}
          onClose={() => setWalkInOpen(false)}
          onCreate={async (payload) => {
            try {
              await createWalkIn(payload)
              notify({ title: t('toast.created') })
              setWalkInOpen(false)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {checkInOpen ? (
        <CheckInModal
          reservations={pendingReservations}
          onClose={() => setCheckInOpen(false)}
          onCreate={async (reservationId) => {
            try {
              await checkIn({ reservationId })
              notify({ title: t('toast.created') })
              setCheckInOpen(false)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}
    </div>
  )
}

function SessionsSchedule({
  bays,
  sessions,
  dayKey,
  timeZone,
  totalMinutes,
  locale,
  currencyLocale,
}: {
  bays: { id: string; code: string; name: string }[]
  sessions: Session[]
  dayKey: string
  timeZone: string
  totalMinutes: number
  locale: string
  currencyLocale: string
}) {
  const { t } = useTranslation('admin')
  const hours = Array.from(
    { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
    (_, index) => SCHEDULE_START_HOUR + index,
  )

  if (bays.length === 0) {
    return <EmptyState message={t('common.empty')} />
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
      <div className="min-w-[52rem]">
        <div
          className="grid border-b border-[var(--gsb-border)] text-xs text-[var(--gsb-muted)]"
          style={{ gridTemplateColumns: `7rem repeat(${hours.length}, minmax(3.5rem, 1fr))` }}
        >
          <div className="px-3 py-2" />
          {hours.map((hour) => (
            <div key={hour} className="border-l border-[var(--gsb-border)] px-1 py-2 text-center">
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {bays.map((bay) => {
          const baySessions = sessions.filter((session) => session.bayId === bay.id)
          return (
            <div
              key={bay.id}
              className="relative grid min-h-20 border-b border-[var(--gsb-border)] last:border-b-0"
              style={{ gridTemplateColumns: `7rem 1fr` }}
            >
              <div className="flex items-center px-3 text-sm font-medium text-[var(--gsb-fg)]">
                {bay.code}
              </div>
              <div className="relative border-l border-[var(--gsb-border)]">
                <div
                  className="pointer-events-none absolute inset-0 grid"
                  style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(3.5rem, 1fr))` }}
                >
                  {hours.map((hour) => (
                    <div key={hour} className="border-l border-[var(--gsb-border)]/60" />
                  ))}
                </div>
                {baySessions.map((session) => {
                  const startMin = Math.max(
                    0,
                    minutesFromDayStart(session.startedAt, dayKey, timeZone) -
                      SCHEDULE_START_HOUR * 60,
                  )
                  const endIso =
                    session.endedAt ??
                    new Date(new Date(session.startedAt).getTime() + 60 * 60_000).toISOString()
                  const endMin = Math.min(
                    totalMinutes,
                    Math.max(
                      startMin + 15,
                      minutesFromDayStart(endIso, dayKey, timeZone) - SCHEDULE_START_HOUR * 60,
                    ),
                  )
                  const left = (startMin / totalMinutes) * 100
                  const width = ((endMin - startMin) / totalMinutes) * 100
                  return (
                    <div
                      key={session.id}
                      className="absolute top-2 bottom-2 overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--gsb-accent)_22%,transparent)] px-2 py-1 text-[11px] text-[var(--gsb-fg)] ring-1 ring-[color-mix(in_oklab,var(--gsb-accent)_40%,transparent)]"
                      style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
                      title={`${formatDateTime(session.startedAt, locale)} · ${session.companionCount} · ${
                        session.totalCostBrl != null
                          ? formatBrl(Number(session.totalCostBrl), currencyLocale)
                          : '—'
                      }`}
                    >
                      <div className="truncate font-medium">{t(`status.${session.status}`)}</div>
                      <div className="truncate text-[var(--gsb-muted)]">
                        {session.companionCount} ·{' '}
                        {session.totalCostBrl != null
                          ? formatBrl(Number(session.totalCostBrl), currencyLocale)
                          : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WalkInModal({
  bays,
  onClose,
  onCreate,
}: {
  bays: { id: string; code: string; name: string }[]
  onClose: () => void
  onCreate: (payload: { bayId: string; companionCount: number }) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [bayId, setBayId] = useState('')
  const [companionCount, setCompanionCount] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!bayId) return
    setSaving(true)
    try {
      await onCreate({ bayId, companionCount })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('sessions.walkIn')} onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('reservations.bay')}
          <select className={`${inputClass} mt-1`} value={bayId} onChange={(event) => setBayId(event.target.value)}>
            <option value="">—</option>
            {bays.map((bay) => (
              <option key={bay.id} value={bay.id}>
                {bay.code} · {bay.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('sessions.companions')}
          <select
            className={`${inputClass} mt-1`}
            value={companionCount}
            onChange={(event) => setCompanionCount(Number(event.target.value))}
          >
            {Array.from({ length: MAX_COMPANION_COUNT - MIN_COMPANION_COUNT + 1 }, (_, i) => i).map(
              (count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ),
            )}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClass} disabled={saving || !bayId}>
            {t('sessions.walkIn')}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CheckInModal({
  reservations,
  onClose,
  onCreate,
}: {
  reservations: { id: string; customerName: string; bay?: { code: string }; companionCount?: number }[]
  onClose: () => void
  onCreate: (reservationId: string) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [reservationId, setReservationId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!reservationId) return
    setSaving(true)
    try {
      await onCreate(reservationId)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('reservations.checkIn')} onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('reservations.checkIn')}
          <select
            className={`${inputClass} mt-1`}
            value={reservationId}
            onChange={(event) => setReservationId(event.target.value)}
          >
            <option value="">—</option>
            {reservations.map((reservation) => (
              <option key={reservation.id} value={reservation.id}>
                {reservation.customerName} · {reservation.bay?.code ?? ''} · +
                {reservation.companionCount ?? 0}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClass} disabled={saving || !reservationId}>
            {t('reservations.checkIn')}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
