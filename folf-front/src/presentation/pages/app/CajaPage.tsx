import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Minus, Plus, Xmark } from '@gravity-ui/icons'
import { formatBrl } from '@/shared/lib/formatBrl'
import { useCatalogStore } from '@/presentation/stores/catalogStore'
import { usePosStore } from '@/presentation/stores/posStore'
import { useOrdersStore } from '@/presentation/stores/ordersStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { matchesQuery } from '@/presentation/components/admin/admin.utils'
import { CustomerPicker } from '@/presentation/components/admin/CustomerPicker'
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
  textareaClass,
} from '@/presentation/components/admin/AdminUi'

export function CajaPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const menu = useCatalogStore((state) => state.menu)
  const loading = useCatalogStore((state) => state.loading)
  const error = useCatalogStore((state) => state.error)
  const loadMenu = useCatalogStore((state) => state.load)
  const createOrder = useOrdersStore((state) => state.create)
  const canCreate = useAuthStore((state) => state.hasPermission('orders:create'))
  const customer = usePosStore((state) => state.customer)
  const tableLabel = usePosStore((state) => state.tableLabel)
  const notes = usePosStore((state) => state.notes)
  const lines = usePosStore((state) => state.lines)
  const setCustomer = usePosStore((state) => state.setCustomer)
  const setTableLabel = usePosStore((state) => state.setTableLabel)
  const setNotes = usePosStore((state) => state.setNotes)
  const addProduct = usePosStore((state) => state.addProduct)
  const setQuantity = usePosStore((state) => state.setQuantity)
  const setLineNotes = usePosStore((state) => state.setLineNotes)
  const removeLine = usePosStore((state) => state.removeLine)
  const clear = usePosStore((state) => state.clear)
  const total = usePosStore((state) => state.total)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!menu) void loadMenu()
  }, [menu, loadMenu])

  const products = useMemo(() => {
    return (menu?.items ?? []).filter((item) => {
      if (!item.isAvailable) return false
      if (category && item.category !== category) return false
      return matchesQuery([item.name, item.description, item.categoryName], search)
    })
  }, [menu, category, search])

  const checkout = async () => {
    if (!customer || lines.length === 0 || !canCreate) return
    setSaving(true)
    try {
      await createOrder({
        customerId: customer.id,
        tableLabel: tableLabel || undefined,
        notes: notes || undefined,
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          notes: line.notes || undefined,
        })),
      })
      notify({ title: t('pos.registered') })
      clear()
    } catch (error) {
      notifyError(t('toast.error'), error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('pos.title')} subtitle={t('pos.subtitle')} />
      {error ? <ErrorBanner message={error} onRetry={() => void loadMenu()} retryLabel={t('common.retry')} /> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section>
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <label className="min-w-56 flex-1 text-xs text-[var(--gsb-muted)]">
              {t('pos.searchProduct')}
              <input
                className={`${inputClass} mt-1`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              className={`${ghostButtonClass} ${category === '' ? 'border-[var(--gsb-accent)]' : ''}`}
              onClick={() => setCategory('')}
            >
              {t('common.all')}
            </button>
            {(menu?.categories ?? []).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${ghostButtonClass} ${category === item.slug ? 'border-[var(--gsb-accent)]' : ''}`}
                onClick={() => setCategory(item.slug)}
              >
                {item.namePt}
              </button>
            ))}
          </div>

          {loading && !menu ? (
            <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
          ) : products.length === 0 ? (
            <EmptyState message={t('common.empty')} />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="overflow-hidden rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] text-left transition hover:border-[var(--gsb-accent)]"
                  onClick={() => addProduct(product)}
                  disabled={!canCreate}
                >
                  <div className="aspect-[4/3] bg-[color-mix(in_oklab,var(--gsb-fg)_6%,transparent)]">
                    {product.imageSrc ? (
                      <img src={product.imageSrc} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
                    <p className="mt-1 text-sm text-[var(--gsb-accent)]">
                      {formatBrl(product.priceBrl, locale)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4 xl:sticky xl:top-4">
          <h2 className="mb-3 font-display text-xl">{t('pos.cart')}</h2>
          <label className="mb-3 block text-xs text-[var(--gsb-muted)]">
            {t('customers.title')}
            <div className="mt-1">
              <CustomerPicker value={customer} onChange={setCustomer} />
            </div>
          </label>
          <label className="mb-3 block text-xs text-[var(--gsb-muted)]">
            {t('orders.tableLabel')}
            <input
              className={`${inputClass} mt-1`}
              value={tableLabel}
              onChange={(event) => setTableLabel(event.target.value)}
            />
          </label>
          <label className="mb-3 block text-xs text-[var(--gsb-muted)]">
            {t('common.notes')}
            <textarea
              className={`${textareaClass} mt-1 min-h-16`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          {lines.length === 0 ? (
            <p className="mb-4 text-sm text-[var(--gsb-muted)]">{t('pos.emptyCart')}</p>
          ) : (
            <ul className="mb-4 grid gap-3">
              {lines.map((line) => (
                <li key={line.productId} className="rounded-xl border border-[var(--gsb-border)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{line.name}</p>
                    <button type="button" className={ghostButtonClass} onClick={() => removeLine(line.productId)}>
                      <Xmark className="size-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--gsb-muted)]">{formatBrl(line.unitPriceBrl, locale)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm">{line.quantity}</span>
                    <button
                      type="button"
                      className={ghostButtonClass}
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    >
                      <Plus className="size-3.5" />
                    </button>
                    <span className="ml-auto text-sm">
                      {formatBrl(line.unitPriceBrl * line.quantity, locale)}
                    </span>
                  </div>
                  <input
                    className={`${inputClass} mt-2 h-8 text-xs`}
                    placeholder={t('common.notes')}
                    value={line.notes}
                    onChange={(event) => setLineNotes(line.productId, event.target.value)}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="mb-3 flex items-center justify-between text-sm">
            <span>{t('recent.total')}</span>
            <strong>{formatBrl(total(), locale)}</strong>
          </div>
          <button
            type="button"
            className={`${primaryButtonClass} w-full`}
            disabled={!canCreate || !customer || lines.length === 0 || saving}
            onClick={() => void checkout()}
          >
            {t('pos.checkout')}
          </button>
        </aside>
      </div>
    </div>
  )
}
