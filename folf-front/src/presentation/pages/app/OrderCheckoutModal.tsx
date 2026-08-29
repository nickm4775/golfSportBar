import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatBrl } from '@/shared/lib/formatBrl'
import { OrderStatus, PaymentMethod } from '@/shared/domain/enums'
import type { Order } from '@/domain/order/Order'
import { useOrdersStore } from '@/presentation/stores/ordersStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { formatApiError } from '@/presentation/components/admin/admin.utils'
import { Modal, primaryButtonClass } from '@/presentation/components/admin/AdminUi'

export function OrderCheckoutModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const checkout = useOrdersStore((state) => state.checkout)
  const liveOrder = useOrdersStore((state) => state.items.find((item) => item.id === order.id) ?? order)
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.PIX)
  const [saving, setSaving] = useState(false)
  const closed = useRef(false)

  const total = Number(liveOrder.totalBrl)

  useEffect(() => {
    if (liveOrder.status !== OrderStatus.COMPLETED || closed.current) return
    closed.current = true
    notify({ title: t('orders.paid') })
    onClose()
  }, [liveOrder.status, onClose, t])

  const lines = useMemo(
    () =>
      (liveOrder.items ?? []).map((item) => ({
        id: item.id,
        label: `${item.quantity}× ${item.product?.namePt ?? item.productId.slice(0, 6)}`,
        total: item.quantity * Number(item.unitPriceBrl),
      })),
    [liveOrder.items],
  )

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await checkout(order.id, { method })
    } catch (error) {
      notifyError(t('toast.error'), error, formatApiError(error, t, locale))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('orders.checkoutTitle')} onClose={onClose}>
      <div className="grid gap-4">
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--gsb-muted)]">{t('reservations.customer')}</dt>
            <dd>{liveOrder.customer?.fullName ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--gsb-muted)]">{t('orders.tableLabel')}</dt>
            <dd>{liveOrder.tableLabel ?? '—'}</dd>
          </div>
        </dl>

        <ul className="grid gap-1 text-sm">
          {lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4">
              <span>{line.label}</span>
              <span>{formatBrl(line.total, locale)}</span>
            </li>
          ))}
        </ul>

        <p className="flex justify-between text-base font-medium">
          <span>{t('recent.total')}</span>
          <span>{formatBrl(total, locale)}</span>
        </p>

        <fieldset className="grid gap-2">
          <legend className="text-xs text-[var(--gsb-muted)]">{t('orders.paymentMethod')}</legend>
          <div className="flex gap-2">
            {(Object.values(PaymentMethod) as PaymentMethod[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`${ghostToggleClass} ${method === value ? 'border-[var(--gsb-accent)] bg-[var(--gsb-accent)]/10' : ''}`}
                onClick={() => setMethod(value)}
                disabled={saving}
              >
                {t(`orders.method.${value}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className={primaryButtonClass}
          disabled={saving}
          onClick={() => void handleConfirm()}
        >
          {saving
            ? t('common.loading')
            : method === PaymentMethod.PIX
              ? t('orders.confirmPix')
              : t('orders.confirmCash')}
        </button>
      </div>
    </Modal>
  )
}

const ghostToggleClass =
  'inline-flex items-center justify-center rounded-full border border-[var(--gsb-border)] px-3 py-1.5 text-xs text-[var(--gsb-fg)]'
