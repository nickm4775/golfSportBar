import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Funnel, Xmark } from '@gravity-ui/icons'
import { ReservationStatus } from '@/shared/domain/enums'
import type { Customer } from '@/domain/customer/Customer'
import {
  MAX_COMPANION_COUNT,
  MIN_COMPANION_COUNT,
  computeReservationPreview,
  formatBrl,
} from '@/domain/gspro/gsproPricing'
import { useGsproStore } from '@/presentation/stores/gsproStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import {
  addMinutesToDatetimeLocal,
  formatApiError,
  formatDateTime,
  matchesQuery,
} from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'
import { CustomerPicker } from '@/presentation/components/admin/CustomerPicker'
import {
  EmptyState,
  ErrorBanner,
  IconButton,
  ListToolbar,
  Modal,
  PageHeader,
  PaginationBar,
  PrimaryAction,
  StatusBadge,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'

export function ReservationsPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const currencyLocale = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-BR' : 'en-US'
  const reservations = useGsproStore((state) => state.reservations)
  const bays = useGsproStore((state) => state.bays)
  const loading = useGsproStore((state) => state.loading)
  const error = useGsproStore((state) => state.error)
  const loadReservations = useGsproStore((state) => state.loadReservations)
  const createReservation = useGsproStore((state) => state.createReservation)
  const updateReservation = useGsproStore((state) => state.updateReservation)
  const canWrite = useAuthStore((state) => state.hasPermission('gspro:reservations:write'))
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('')

  useEffect(() => {
    if (activeBusinessId) void loadReservations()
  }, [loadReservations, activeBusinessId])

  const filtered = useMemo(
    () =>
      reservations.filter((reservation) => {
        const matchesStatus = statusFilter ? reservation.status === statusFilter : true
        return (
          matchesStatus &&
          matchesQuery(
            [
              reservation.customerName,
              reservation.customerPhone,
              reservation.customer?.fullName,
              reservation.bay?.code,
              reservation.status,
            ],
            search,
          )
        )
      }),
    [reservations, search, statusFilter],
  )
  const pageState = usePagination(filtered, `${search}:${statusFilter}:${activeBusinessId ?? ''}`)

  return (
    <div>
      <PageHeader
        title={t('reservations.title')}
        subtitle={t('reservations.subtitle')}
        actions={
          canWrite ? (
            <PrimaryAction label={t('reservations.new')} onClick={() => setCreateOpen(true)} />
          ) : null
        }
      />
      {error ? (
        <ErrorBanner message={error} onRetry={() => void loadReservations()} retryLabel={t('common.retry')} />
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
            onChange={(event) => setStatusFilter(event.target.value as ReservationStatus | '')}
          >
            <option value="">{t('common.all')}</option>
            {Object.values(ReservationStatus).map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
      </ListToolbar>

      {loading && reservations.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
              <tr>
                <th className="px-4 py-3">{t('reservations.customer')}</th>
                <th>{t('reservations.bay')}</th>
                <th>{t('reservations.start')}</th>
                <th>{t('reservations.end')}</th>
                <th>{t('reservations.companions')}</th>
                <th>{t('reservations.totalCost')}</th>
                <th>{t('orders.changeStatus')}</th>
                <th className="px-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageState.items.map((reservation) => (
                <tr key={reservation.id} className="border-t border-[var(--gsb-border)]">
                  <td className="px-4 py-3">
                    {reservation.customer?.fullName ?? reservation.customerName}
                  </td>
                  <td>{reservation.bay?.code ?? reservation.bayId.slice(0, 8)}</td>
                  <td>{formatDateTime(reservation.startAt, locale)}</td>
                  <td>{formatDateTime(reservation.endAt, locale)}</td>
                  <td>
                    {reservation.companionCount}{' '}
                    <span className="text-[var(--gsb-muted)]">
                      ({1 + reservation.companionCount})
                    </span>
                  </td>
                  <td>{formatBrl(Number(reservation.totalCostBrl ?? 0), currencyLocale)}</td>
                  <td>
                    <StatusBadge label={t(`status.${reservation.status}`)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canWrite && reservation.status === ReservationStatus.PENDING ? (
                        <IconButton
                          label={t('status.CONFIRMED')}
                          onClick={() => {
                            void updateReservation(reservation.id, {
                              status: ReservationStatus.CONFIRMED,
                            })
                              .then(() => notify({ title: t('toast.updated') }))
                              .catch((error) =>
                                notifyError(t('toast.error'), error, formatApiError(error, t, locale)),
                              )
                          }}
                        >
                          <Check className="size-4" />
                        </IconButton>
                      ) : null}
                      {canWrite &&
                      (reservation.status === ReservationStatus.PENDING ||
                        reservation.status === ReservationStatus.CONFIRMED) ? (
                        <IconButton
                          label={t('status.CANCELLED')}
                          tone="danger"
                          onClick={() => {
                            void updateReservation(reservation.id, {
                              status: ReservationStatus.CANCELLED,
                            })
                              .then(() => notify({ title: t('toast.updated') }))
                              .catch((error) =>
                                notifyError(t('toast.error'), error, formatApiError(error, t, locale)),
                              )
                          }}
                        >
                          <Xmark className="size-4" />
                        </IconButton>
                      ) : null}
                    </div>
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

      {createOpen ? (
        <ReservationCreateModal
          bays={bays}
          currencyLocale={currencyLocale}
          onClose={() => setCreateOpen(false)}
          onCreate={async (payload) => {
            try {
              await createReservation(payload)
              notify({ title: t('toast.created') })
              setCreateOpen(false)
            } catch (error) {
              notifyError(t('toast.error'), error, formatApiError(error, t, locale))
            }
          }}
        />
      ) : null}
    </div>
  )
}

function ReservationCreateModal({
  bays,
  currencyLocale,
  onClose,
  onCreate,
}: {
  bays: { id: string; code: string; name: string }[]
  currencyLocale: string
  onClose: () => void
  onCreate: (payload: {
    bayId: string
    customerId: string
    startAt: string
    endAt: string
    companionCount: number
  }) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [bayId, setBayId] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [companionCount, setCompanionCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const autoEndRef = useRef('')

  const preview =
    startAt && endAt
      ? computeReservationPreview(
          companionCount,
          new Date(startAt).toISOString(),
          new Date(endAt).toISOString(),
        )
      : null

  const handleStartChange = (value: string) => {
    setStartAt(value)
    if (!value) return
    const nextEnd = addMinutesToDatetimeLocal(value, 60)
    setEndAt((current) => {
      if (!current || current === autoEndRef.current) {
        autoEndRef.current = nextEnd
        return nextEnd
      }
      return current
    })
  }

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!bayId || !customer || !startAt || !endAt) return
    setSaving(true)
    try {
      await onCreate({
        bayId,
        customerId: customer.id,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        companionCount,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('reservations.new')} onClose={onClose}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void handleCreate(event)}>
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
          {t('reservations.companions')}
          <select
            className={`${inputClass} mt-1`}
            value={companionCount}
            onChange={(event) => setCompanionCount(Number(event.target.value))}
          >
            {Array.from({ length: MAX_COMPANION_COUNT - MIN_COMPANION_COUNT + 1 }, (_, i) => i).map(
              (count) => (
                <option key={count} value={count}>
                  {count} (+{count + 1} {t('reservations.partySize').toLowerCase()})
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
          {t('reservations.customer')}
          <div className="mt-1">
            <CustomerPicker value={customer} onChange={setCustomer} />
          </div>
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('reservations.start')}
          <input
            className={`${inputClass} mt-1`}
            type="datetime-local"
            value={startAt}
            onChange={(event) => handleStartChange(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('reservations.end')}
          <input
            className={`${inputClass} mt-1`}
            type="datetime-local"
            value={endAt}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </label>
        {preview ? (
          <p className="sm:col-span-2 rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-bg)] px-3 py-2 text-sm text-[var(--gsb-fg)]">
            {t('reservations.pricingPreview', {
              party: preview.partySize,
              unit: formatBrl(preview.unitPriceBrl, currencyLocale),
              hours: preview.hours.toFixed(2),
              total: formatBrl(preview.totalCostBrl, currencyLocale),
            })}
          </p>
        ) : null}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className={primaryButtonClass} disabled={saving || !customer}>
            {t('common.create')}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
