import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Eye, Funnel, Printer, Xmark } from '@gravity-ui/icons'
import { formatBrl } from '@/shared/lib/formatBrl'
import { OrderStatus } from '@/shared/domain/enums'
import { useOrdersStore } from '@/presentation/stores/ordersStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { usePrintStore } from '@/presentation/stores/printStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { formatDateTime, matchesQuery, nextOrderStatuses } from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'
import {
  EmptyState,
  ErrorBanner,
  IconButton,
  ListToolbar,
  PageHeader,
  PaginationBar,
  StatusBadge,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'
import { OrderCheckoutModal } from './OrderCheckoutModal'
import { OrderDetailsModal } from './OrderDetailsModal'
import type { Order } from '@/domain/order/Order'

export function OrdersPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const items = useOrdersStore((state) => state.items)
  const loading = useOrdersStore((state) => state.loading)
  const error = useOrdersStore((state) => state.error)
  const load = useOrdersStore((state) => state.load)
  const updateStatus = useOrdersStore((state) => state.updateStatus)
  const printReceipt = usePrintStore((state) => state.printReceipt)
  const canRead = useAuthStore((state) => state.hasPermission('orders:read'))
  const canCreate = useAuthStore((state) => state.hasPermission('orders:create'))
  const canManage = useAuthStore((state) => state.hasPermission('orders:manage'))
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [search, setSearch] = useState('')
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null)
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null)
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (activeBusinessId) void load(statusFilter || undefined)
  }, [load, statusFilter, activeBusinessId])

  const filtered = useMemo(
    () =>
      items
        .filter((order) =>
          matchesQuery(
            [order.tableLabel, order.status, order.customer?.fullName, order.customer?.phone],
            search,
          ),
        )
        .sort((a, b) => {
          const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt)
          return byDate !== 0 ? byDate : b.id.localeCompare(a.id)
        }),
    [items, search],
  )
  const pageState = usePagination(filtered, `${search}:${statusFilter}:${activeBusinessId ?? ''}`)

  return (
    <div>
      <PageHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        actions={
          canCreate ? (
            <Link to="/app/caja" className={primaryButtonClass}>
              {t('orders.openCaja')}
            </Link>
          ) : null
        }
      />

      <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')}>
        <label className="text-xs text-[var(--gsb-muted)]">
          <span className="mb-1 inline-flex items-center gap-1">
            <Funnel className="size-3.5" />
            {t('common.filter')}
          </span>
          <select
            className={`${inputClass} mt-1 w-auto min-w-40`}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as OrderStatus | '')}
          >
            <option value="">{t('common.all')}</option>
            {Object.values(OrderStatus).map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`)}
              </option>
            ))}
          </select>
        </label>
      </ListToolbar>

      {error ? (
        <ErrorBanner
          message={error}
          onRetry={() => void load(statusFilter || undefined)}
          retryLabel={t('common.retry')}
        />
      ) : null}

      {loading && items.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
              <tr>
                <th className="px-4 py-3">{t('reservations.customer')}</th>
                <th>{t('orders.tableLabel')}</th>
                <th>{t('orders.items')}</th>
                <th>{t('recent.total')}</th>
                <th>{t('orders.payment')}</th>
                <th>{t('orders.changeStatus')}</th>
                <th />
                <th className="px-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageState.items.map((order) => (
                <tr key={order.id} className="border-t border-[var(--gsb-border)]">
                  <td className="px-4 py-3">{order.customer?.fullName ?? '—'}</td>
                  <td>{order.tableLabel ?? '—'}</td>
                  <td className="max-w-56 truncate text-[var(--gsb-muted)]">
                    {(order.items ?? [])
                      .map((item) => `${item.quantity}× ${item.product?.namePt ?? item.productId.slice(0, 6)}`)
                      .join(', ') || '—'}
                  </td>
                  <td>{formatBrl(Number(order.totalBrl), locale)}</td>
                  <td>
                    {order.payment
                      ? t(`orders.method.${order.payment.method}`)
                      : '—'}
                  </td>
                  <td>
                    <StatusBadge label={t(`status.${order.status}`)} status={order.status} />
                  </td>
                  <td className="text-[var(--gsb-muted)]">{formatDateTime(order.createdAt, locale)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canRead ? (
                        <IconButton label={t('orders.details')} onClick={() => setDetailsOrderId(order.id)}>
                          <Eye className="size-4" />
                        </IconButton>
                      ) : null}
                      {canRead ? (
                        <IconButton
                          label={t('orders.printReceipt')}
                          disabled={printingOrderId === order.id}
                          onClick={() => {
                            setPrintingOrderId(order.id)
                            void printReceipt(order.id)
                              .then(() => notify({ title: t('orders.printingInProgress') }))
                              .catch((error) => notifyError(t('toast.error'), error))
                              .finally(() => setPrintingOrderId(null))
                          }}
                        >
                          <Printer className="size-4" />
                        </IconButton>
                      ) : null}
                      {canManage
                        ? nextOrderStatuses(order.status).map((status) => (
                            <IconButton
                              key={status}
                              label={t(`status.${status}`)}
                              tone={status === OrderStatus.CANCELLED ? 'danger' : 'ghost'}
                              onClick={() => {
                                if (status === OrderStatus.COMPLETED) {
                                  setCheckoutOrder(order)
                                  return
                                }
                                void updateStatus(order.id, status)
                                  .then(() => notify({ title: t('toast.updated') }))
                                  .catch((error) => notifyError(t('toast.error'), error))
                              }}
                            >
                              {status === OrderStatus.CANCELLED ? (
                                <Xmark className="size-4" />
                              ) : (
                                <Check className="size-4" />
                              )}
                            </IconButton>
                          ))
                        : null}
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

      {checkoutOrder ? (
        <OrderCheckoutModal order={checkoutOrder} onClose={() => setCheckoutOrder(null)} />
      ) : null}

      {detailsOrderId ? (
        <OrderDetailsModal orderId={detailsOrderId} onClose={() => setDetailsOrderId(null)} />
      ) : null}
    </div>
  )
}
