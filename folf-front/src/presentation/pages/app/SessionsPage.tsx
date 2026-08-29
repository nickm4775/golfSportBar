import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Funnel, Xmark } from '@gravity-ui/icons'
import { ReservationStatus, SessionStatus } from '@/shared/domain/enums'
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

export function SessionsPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
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

  useEffect(() => {
    if (activeBusinessId) void loadSessions(statusFilter || undefined)
  }, [loadSessions, statusFilter, activeBusinessId])

  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === ReservationStatus.CONFIRMED,
  )

  const filtered = useMemo(
    () =>
      sessions.filter((session) =>
        matchesQuery([session.bay?.code, session.status, session.notes], search),
      ),
    [sessions, search],
  )
  const pageState = usePagination(filtered, `${search}:${statusFilter}:${activeBusinessId ?? ''}`)

  return (
    <div>
      <PageHeader
        title={t('sessions.title')}
        subtitle={t('sessions.subtitle')}
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primaryButtonClass} onClick={() => setWalkInOpen(true)}>
                {t('sessions.walkIn')}
              </button>
              <button type="button" className={ghostButtonClass} onClick={() => setCheckInOpen(true)}>
                {t('reservations.checkIn')}
              </button>
            </div>
          ) : null
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
      </ListToolbar>

      {loading && sessions.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
              <tr>
                <th className="px-4 py-3">{t('reservations.bay')}</th>
                <th>{t('sessions.started')}</th>
                <th>{t('orders.changeStatus')}</th>
                <th className="px-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageState.items.map((session) => (
                <tr key={session.id} className="border-t border-[var(--gsb-border)]">
                  <td className="px-4 py-3">{session.bay?.code ?? session.bayId.slice(0, 8)}</td>
                  <td>{formatDateTime(session.startedAt, locale)}</td>
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
      )}

      <PaginationBar
        page={pageState.page}
        totalPages={pageState.totalPages}
        total={pageState.total}
        pageLabel={t('common.page', { current: pageState.page, total: pageState.totalPages })}
        previousLabel={t('common.previous')}
        nextLabel={t('common.next')}
        onPageChange={pageState.setPage}
      />

      {walkInOpen ? (
        <WalkInModal
          bays={bays}
          onClose={() => setWalkInOpen(false)}
          onCreate={async (bayId) => {
            try {
              await createWalkIn({ bayId })
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

function WalkInModal({
  bays,
  onClose,
  onCreate,
}: {
  bays: { id: string; code: string; name: string }[]
  onClose: () => void
  onCreate: (bayId: string) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [bayId, setBayId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!bayId) return
    setSaving(true)
    try {
      await onCreate(bayId)
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
  reservations: { id: string; customerName: string; bay?: { code: string } }[]
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
                {reservation.customerName} · {reservation.bay?.code ?? ''}
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
