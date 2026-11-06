import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBrl } from '@/shared/lib/formatBrl'
import type { Order, OrderItem } from '@/domain/order/Order'
import { OrderItemStatus, OrderStatus } from '@/shared/domain/enums'
import { useOrdersStore } from '@/presentation/stores/ordersStore'
import { useCatalogStore } from '@/presentation/stores/catalogStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { formatDateTime } from '@/presentation/components/admin/admin.utils'
import { Modal, StatusBadge, ghostButtonClass, inputClass, primaryButtonClass } from '@/presentation/components/admin/AdminUi'

const NEXT_ITEM_STATUS: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  [OrderItemStatus.PENDING]: OrderItemStatus.PREPARING,
  [OrderItemStatus.PREPARING]: OrderItemStatus.SERVED,
  [OrderItemStatus.SERVED]: OrderItemStatus.PREPARING,
}

type PendingItem = {
  key: string
  productId: string
  name: string
  unitPriceBrl: number
  quantity: number
  notes: string
}

export function OrderDetailsModal({
  orderId,
  onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const getById = useOrdersStore((state) => state.getById)
  const addItems = useOrdersStore((state) => state.addItems)
  const updateItemStatus = useOrdersStore((state) => state.updateItemStatus)
  const setServiceCharge = useOrdersStore((state) => state.setServiceCharge)
  const liveOrder = useOrdersStore((state) => state.items.find((item) => item.id === orderId))
  const [loading, setLoading] = useState(!liveOrder?.items?.length)
  const [error, setError] = useState<string | null>(null)
  const canAddItem = useAuthStore((state) => state.hasPermission('orders:create'))
  const canManage = useAuthStore((state) => state.hasPermission('orders:manage'))
  const menu = useCatalogStore((state) => state.menu)
  const loadMenu = useCatalogStore((state) => state.load)
  const [newItemProductId, setNewItemProductId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemNotes, setNewItemNotes] = useState('')
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [confirmingItems, setConfirmingItems] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [updatingServiceCharge, setUpdatingServiceCharge] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void getById(orderId)
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('common.error'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [getById, orderId, t])

  useEffect(() => {
    if (!menu) void loadMenu()
  }, [menu, loadMenu])

  const availableProducts = useMemo(() => (menu?.items ?? []).filter((item) => item.isAvailable), [menu])

  const filterProducts = (query: string) => {
    const needle = normalizeSearch(query)
    if (!needle) return availableProducts
    return availableProducts.filter(
      (product) =>
        normalizeSearch(product.name).includes(needle) ||
        normalizeSearch(product.categoryName ?? '').includes(needle),
    )
  }

  // Keep the selected product visible so the select never holds a value without an option.
  const productMatches = filterProducts(productQuery)
  const selectedProduct = availableProducts.find((product) => product.id === newItemProductId)
  const filteredProducts =
    selectedProduct && !productMatches.includes(selectedProduct)
      ? [selectedProduct, ...productMatches]
      : productMatches

  const handleProductQueryChange = (query: string) => {
    setProductQuery(query)
    const matches = filterProducts(query)
    if (query.trim() && matches.length === 1) setNewItemProductId(matches[0].id)
  }

  const order: Order | undefined = liveOrder
  const isClosed = order?.status === OrderStatus.COMPLETED || order?.status === OrderStatus.CANCELLED
  // The API returns items in storage order, which shifts after an update; keep rows in place.
  const orderItems = [...(order?.items ?? [])].sort(compareItems)

  const handleAddPendingItem = () => {
    if (!selectedProduct) return
    setPendingItems((items) => [
      ...items,
      {
        key: crypto.randomUUID(),
        productId: selectedProduct.id,
        name: selectedProduct.name,
        unitPriceBrl: Number(selectedProduct.priceBrl),
        quantity: newItemQuantity,
        notes: newItemNotes.trim(),
      },
    ])
    setNewItemProductId('')
    setProductQuery('')
    setNewItemQuantity(1)
    setNewItemNotes('')
  }

  const handleConfirmItems = () => {
    setConfirmingItems(true)
    void addItems(
      orderId,
      pendingItems.map(({ productId, quantity, notes }) => ({
        productId,
        quantity,
        notes: notes || undefined,
      })),
    )
      .then((updated) => {
        setPendingItems([])
        notify({ title: t('toast.updated') })
        const failedJobs = (updated.printJobs ?? []).filter((job) => job.status === 'FAILED')
        if (failedJobs.length) {
          notify({
            title: t('orders.printFailed'),
            description: failedJobs.map((job) => `${job.station}: ${job.errorMessage ?? ''}`).join(' · '),
            variant: 'danger',
          })
        }
      })
      .catch((error) => notifyError(t('toast.error'), error))
      .finally(() => setConfirmingItems(false))
  }

  const handleClose = () => {
    if (pendingItems.length && !window.confirm(t('orders.discardPendingItems'))) return
    onClose()
  }

  const handleItemStatusClick = (item: OrderItem, nextStatus: OrderItemStatus) => {
    setUpdatingItemId(item.id)
    void updateItemStatus(orderId, item.id, nextStatus)
      .catch((error) => notifyError(t('toast.error'), error))
      .finally(() => setUpdatingItemId(null))
  }

  const handleServiceChargeChange = (includeServiceCharge: boolean) => {
    setUpdatingServiceCharge(true)
    void setServiceCharge(orderId, includeServiceCharge)
      .then(() => notify({ title: t('toast.updated') }))
      .catch((error) => notifyError(t('toast.error'), error))
      .finally(() => setUpdatingServiceCharge(false))
  }

  return (
    <Modal title={t('orders.detailTitle')} onClose={handleClose} wide>
      {loading && !order ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : !order ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.empty')}</p>
      ) : (
        <div className="grid gap-5">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-[var(--gsb-muted)]">{t('reservations.customer')}</dt>
              <dd className="font-medium">{order.customer?.fullName ?? '—'}</dd>
              {order.customer?.phone ? (
                <dd className="text-[var(--gsb-muted)]">{order.customer.phone}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-xs text-[var(--gsb-muted)]">{t('orders.tableLabel')}</dt>
              <dd className="font-medium">{order.tableLabel ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--gsb-muted)]">{t('orders.changeStatus')}</dt>
              <dd className="mt-1">
                <StatusBadge label={t(`status.${order.status}`)} status={order.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--gsb-muted)]">{t('recent.when')}</dt>
              <dd>{formatDateTime(order.createdAt, locale)}</dd>
            </div>
          </dl>

          {order.notes ? (
            <div className="rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-3 text-sm">
              <p className="text-xs text-[var(--gsb-muted)]">{t('common.notes')}</p>
              <p className="mt-1 whitespace-pre-wrap">{order.notes}</p>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-[var(--gsb-border)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="bg-[var(--gsb-surface)] text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
                <tr>
                  <th className="px-3 py-2">{t('orders.product')}</th>
                  <th>{t('common.quantity')}</th>
                  <th>{t('common.price')}</th>
                  <th>{t('orders.changeStatus')}</th>
                  <th className="px-3">{t('common.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-[var(--gsb-muted)]">
                      {t('common.empty')}
                    </td>
                  </tr>
                ) : (
                  orderItems.map((item) => {
                    const nextStatus = NEXT_ITEM_STATUS[item.status]
                    const badge = <StatusBadge label={t(`status.${item.status}`)} status={item.status} />
                    return (
                    <tr key={item.id} className="border-t border-[var(--gsb-border)]">
                      <td className="px-3 py-2">
                        {item.product?.namePt ?? item.productId.slice(0, 8)}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatBrl(Number(item.unitPriceBrl) * item.quantity, locale)}</td>
                      <td>
                        {canManage && nextStatus && order.status !== OrderStatus.CANCELLED ? (
                          <button
                            type="button"
                            className="cursor-pointer rounded-full transition-opacity hover:opacity-75 disabled:cursor-wait disabled:opacity-50"
                            disabled={updatingItemId === item.id}
                            aria-label={`${t('orders.changeStatus')}: ${t(`status.${nextStatus}`)}`}
                            title={t(`status.${nextStatus}`)}
                            onClick={() => handleItemStatusClick(item, nextStatus)}
                          >
                            {badge}
                          </button>
                        ) : (
                          badge
                        )}
                      </td>
                      <td className="max-w-40 truncate px-3 py-2 text-[var(--gsb-muted)]">
                        {item.notes ?? '—'}
                      </td>
                    </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {canAddItem && !isClosed ? (
            <form
              className="grid gap-2 rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-3 sm:grid-cols-[1fr_6rem_1fr_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                handleAddPendingItem()
              }}
            >
              <label className="text-xs text-[var(--gsb-muted)]">
                {t('orders.product')}
                <input
                  type="search"
                  className={`${inputClass} mt-1`}
                  value={productQuery}
                  placeholder={t('orders.searchProduct')}
                  aria-label={t('orders.searchProduct')}
                  onChange={(event) => handleProductQueryChange(event.target.value)}
                />
                <select
                  className={`${inputClass} mt-1`}
                  value={newItemProductId}
                  onChange={(event) => setNewItemProductId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t('orders.product')}
                  </option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-[var(--gsb-muted)]">
                {t('common.quantity')}
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} mt-1`}
                  value={newItemQuantity}
                  onChange={(event) => setNewItemQuantity(Number(event.target.value))}
                />
              </label>
              <label className="text-xs text-[var(--gsb-muted)]">
                {t('common.notes')}
                <input
                  className={`${inputClass} mt-1`}
                  value={newItemNotes}
                  onChange={(event) => setNewItemNotes(event.target.value)}
                />
              </label>
              <button type="submit" className={ghostButtonClass} disabled={!newItemProductId}>
                {t('orders.addItem')}
              </button>
            </form>
          ) : null}

          {pendingItems.length ? (
            <section className="grid gap-3 rounded-xl border border-[var(--gsb-accent)] p-3">
              <h3 className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
                {t('orders.pendingItems')}
              </h3>
              <ul className="grid gap-2 text-sm">
                {pendingItems.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">
                      {item.quantity}× {item.name}
                      {item.notes ? <span className="text-[var(--gsb-muted)]"> · {item.notes}</span> : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      {formatBrl(item.unitPriceBrl * item.quantity, locale)}
                      <button
                        type="button"
                        className={ghostButtonClass}
                        disabled={confirmingItems}
                        onClick={() =>
                          setPendingItems((items) => items.filter((pending) => pending.key !== item.key))
                        }
                      >
                        {t('common.delete')}
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`${primaryButtonClass} justify-self-end`}
                disabled={confirmingItems}
                onClick={handleConfirmItems}
              >
                {t('orders.confirmItems')}
              </button>
            </section>
          ) : null}

          <div className="grid gap-2 rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4 text-sm">
            {canManage && !isClosed ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(order.includeServiceCharge)}
                  disabled={updatingServiceCharge}
                  onChange={(event) => handleServiceChargeChange(event.target.checked)}
                />
                <span>{t('pos.serviceCharge')}</span>
              </label>
            ) : null}
            {Number(order.serviceChargeBrl ?? 0) > 0 ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--gsb-muted)]">{t('orders.subtotal')}</span>
                  <span>
                    {formatBrl(
                      Number(order.totalBrl) - Number(order.serviceChargeBrl ?? 0),
                      locale,
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--gsb-muted)]">{t('orders.serviceCharge')}</span>
                  <span>{formatBrl(Number(order.serviceChargeBrl), locale)}</span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between font-medium">
              <span>{t('recent.total')}</span>
              <span>{formatBrl(Number(order.totalBrl), locale)}</span>
            </div>
            {order.payment ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--gsb-muted)]">{t('orders.payment')}</span>
                  <span>{t(`orders.method.${order.payment.method}`)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[var(--gsb-muted)]">{t('orders.paymentStatusLabel')}</span>
                  <StatusBadge label={t(`orders.paymentStatus.${order.payment.status}`)} />
                </div>
                {order.payment.paidAt ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-[var(--gsb-muted)]">{t('orders.paidAt')}</span>
                    <span>{formatDateTime(order.payment.paidAt, locale)}</span>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-[var(--gsb-muted)]">{t('orders.noPayment')}</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

function compareItems(a: OrderItem, b: OrderItem) {
  return Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id)
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
