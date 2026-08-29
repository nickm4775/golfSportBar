import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Magnifier, Plus, Xmark } from '@gravity-ui/icons'
import type { Customer, CustomerPayload } from '@/domain/customer/Customer'
import { useCustomersStore } from '@/presentation/stores/customersStore'
import { notifyError } from '@/presentation/lib/notify'
import { ghostButtonClass, inputClass, Modal } from '@/presentation/components/admin/AdminUi'
import { CustomerForm } from '@/presentation/components/admin/CustomerForm'

export function CustomerPicker({
  value,
  onChange,
}: {
  value: Customer | null
  onChange: (customer: Customer | null) => void
}) {
  const { t } = useTranslation('admin')
  const search = useCustomersStore((state) => state.search)
  const create = useCustomersStore((state) => state.create)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handle = window.setTimeout(() => {
      void search(query)
        .then(setResults)
        .catch((error) => notifyError(t('toast.error'), error))
    }, 250)
    return () => window.clearTimeout(handle)
  }, [open, query, search, t])

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{value.fullName}</p>
          <p className="truncate text-xs text-[var(--gsb-muted)]">
            {value.cpf} · {value.phone}
          </p>
        </div>
        <button type="button" className={ghostButtonClass} onClick={() => onChange(null)}>
          <Xmark className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <span className="relative block">
        <Magnifier className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--gsb-muted)]" />
          <input
            className={`${inputClass} pl-9`}
            placeholder={t('customers.searchPlaceholder')}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 180)
            }}
          />
      </span>
      {open ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-bg)] shadow-lg">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--gsb-accent)] hover:bg-[color-mix(in_oklab,var(--gsb-fg)_6%,transparent)]"
            onClick={() => {
              setCreateOpen(true)
              setOpen(false)
            }}
          >
            <Plus className="size-4" />
            {t('customers.new')}
          </button>
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className="block w-full px-3 py-2 text-left hover:bg-[color-mix(in_oklab,var(--gsb-fg)_6%,transparent)]"
              onClick={() => {
                onChange(customer)
                setQuery('')
                setOpen(false)
              }}
            >
              <p className="text-sm">{customer.fullName}</p>
              <p className="text-xs text-[var(--gsb-muted)]">
                {customer.cpf} · {customer.phone}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {createOpen ? (
        <Modal title={t('customers.new')} onClose={() => setCreateOpen(false)} wide>
          <CustomerForm
            submitLabel={t('common.create')}
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (payload: CustomerPayload) => {
              const customer = await create(payload)
              onChange(customer)
              setCreateOpen(false)
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}
