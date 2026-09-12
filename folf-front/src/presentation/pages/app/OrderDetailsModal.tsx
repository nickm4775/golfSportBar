import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBrl } from '@/shared/lib/formatBrl'
import type { Order } from '@/domain/order/Order'
import { OrderStatus } from '@/shared/domain/enums'
import { useOrdersStore } from '@/presentation/stores/ordersStore'
import { useCatalogStore } from '@/presentation/stores/catalogStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { formatDateTime } from '@/presentation/components/admin/admin.utils'
import { Modal, StatusBadge, inputClass, primaryButtonClass } from '@/presentation/components/admin/AdminUi'

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
  const addItem = useOrdersStore((state) => state.addItem)
  const liveOrder = useOrdersStore((state) => state.items.find((item) => item.id === orderId))
  const [loading, setLoading] = useState(!liveOrder?.items?.length)
  const [error, setError] = useState<string | null>(null)
  const canAddItem = useAuthStore((state) => state.hasPermission('orders:create'))
  const menu = useCatalogStore((state) => state.menu)
  const loadMenu = useCatalogStore((state) => state.load)
  const [newItemProductId, setNewItemProductId] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemNotes, setNewItemNotes] = useState('')
  const [addingItem, setAddingItem] = useState(false)

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

  const order: Order | undefined = liveOrder

  return (
    <Modal title={t('orders.detailTitle')} onClose={onClose} wide>
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
                <StatusBadge label={t(`status.${order.status}`)} />
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
                {(order.items ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-[var(--gsb-muted)]">
                      {t('common.empty')}
                    </td>
                  </tr>
                ) : (
                  (order.items ?? []).map((item) => (
                    <tr key={item.id} className="border-t border-[var(--gsb-border)]">
                      <td className="px-3 py-2">
                        {item.product?.namePt ?? item.productId.slice(0, 8)}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatBrl(Number(item.unitPriceBrl) * item.quantity, locale)}</td>
                      <td>
                        <StatusBadge label={t(`status.${item.status}`)} />
                      </td>
                      <td className="max-w-40 truncate px-3 py-2 text-[var(--gsb-muted)]">
                        {item.notes ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {canAddItem && order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED ? (
            <form
              className="grid gap-2 rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-3 sm:grid-cols-[1fr_6rem_1fr_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault()
                if (!newItemProductId) return
                setAddingItem(true)
                void addItem(order.id, {
                  productId: newItemProductId,
                  quantity: newItemQuantity,
                  notes: newItemNotes || undefined,
                })
                  .then(() => {
                    setNewItemProductId('')
                    setNewItemQuantity(1)
                    setNewItemNotes('')
                    notify({ title: t('toast.updated') })
                  })
                  .catch((error) => notifyError(t('toast.error'), error))
                  .finally(() => setAddingItem(false))
              }}
            >
              <label className="text-xs text-[var(--gsb-muted)]">
                {t('orders.product')}
                <select
                  className={`${inputClass} mt-1`}
                  value={newItemProductId}
                  onChange={(event) => setNewItemProductId(event.target.value)}
                  required
                >
                  <option value="" disabled>
                    {t('orders.product')}
                  </option>
                  {availableProducts.map((product) => (
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
              <button type="submit" className={primaryButtonClass} disabled={!newItemProductId || addingItem}>
                {t('orders.addItem')}
              </button>
            </form>
          ) : null}

          <div className="grid gap-2 rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4 text-sm">
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
