import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, TrashBin } from '@gravity-ui/icons'
import { useBusinessStore } from '@/presentation/stores/businessStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import type { Business, CreateBusinessPayload } from '@/domain/business/Business'
import { BaysModal } from '@/presentation/components/admin/BaysModal'
import { notify, notifyError } from '@/presentation/lib/notify'
import { matchesQuery, slugFromName } from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'
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
  dangerButtonClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'

export function BusinessPage() {
  const { t } = useTranslation('admin')
  const businesses = useBusinessStore((state) => state.businesses)
  const loading = useBusinessStore((state) => state.loading)
  const error = useBusinessStore((state) => state.error)
  const canCreateBusiness = useBusinessStore((state) => state.canCreateBusiness)
  const loadBusinesses = useBusinessStore((state) => state.loadBusinesses)
  const createBusiness = useBusinessStore((state) => state.createBusiness)
  const updateBusiness = useBusinessStore((state) => state.updateBusiness)
  const deactivateBusiness = useBusinessStore((state) => state.deactivateBusiness)
  const canWrite = useAuthStore((state) => state.hasPermission('business:write'))
  const canReadBays = useAuthStore((state) => state.hasPermission('gspro:bays:read'))
  const canWriteBays = useAuthStore((state) => state.hasPermission('gspro:bays:write'))
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Business | null>(null)
  const [deleting, setDeleting] = useState<Business | null>(null)
  const [baysFor, setBaysFor] = useState<Business | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    void loadBusinesses()
  }, [loadBusinesses])

  const filtered = useMemo(
    () =>
      businesses.filter((business) =>
        matchesQuery([business.name, business.slug, business.city, business.address], search),
      ),
    [businesses, search],
  )
  const pageState = usePagination(filtered, search)

  const openBays = (business: Business) => {
    if (canReadBays) setBaysFor(business)
  }

  return (
    <div>
      <PageHeader
        title={t('business.title')}
        subtitle={t('business.subtitle')}
        actions={
          canCreateBusiness ? (
            <PrimaryAction label={t('business.new')} onClick={() => setCreating(true)} />
          ) : null
        }
      />
      {error ? (
        <ErrorBanner message={error} onRetry={() => void loadBusinesses()} retryLabel={t('common.retry')} />
      ) : null}

      <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')} />

      {loading && businesses.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageState.items.map((business) => (
            <li key={business.id}>
              <article
                className={`h-full rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-5 text-left ${
                  canReadBays ? 'cursor-pointer hover:border-[var(--gsb-accent)]' : ''
                }`}
                onClick={() => openBays(business)}
              >
                <p className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">{business.slug}</p>
                <h2 className="mt-1 font-display text-2xl">{business.name}</h2>
                <p className="mt-2 text-sm text-[var(--gsb-muted)]">{business.address}</p>
                <p className="text-sm text-[var(--gsb-muted)]">
                  {[business.district, business.city, business.state].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-3">
                  <StatusBadge label={business.isActive ? t('common.active') : t('common.inactive')} />
                </div>
                {canWrite ? (
                  <div className="mt-4 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                    <IconButton
                      label={t('common.edit')}
                      onClick={(event: MouseEvent) => {
                        event.stopPropagation()
                        setEditing(business)
                      }}
                    >
                      <Pencil className="size-4" />
                    </IconButton>
                    <IconButton
                      label={t('common.delete')}
                      tone="danger"
                      onClick={(event: MouseEvent) => {
                        event.stopPropagation()
                        setDeleting(business)
                      }}
                    >
                      <TrashBin className="size-4" />
                    </IconButton>
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
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

      {creating ? (
        <BusinessCreateModal
          onClose={() => setCreating(false)}
          onCreate={async (payload) => {
            try {
              await createBusiness(payload)
              notify({ title: t('toast.created') })
              setCreating(false)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {editing ? (
        <BusinessEditModal
          business={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            try {
              await updateBusiness(editing.id, payload)
              notify({ title: t('toast.updated') })
              setEditing(null)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {deleting ? (
        <Modal title={t('business.deleteTitle')} onClose={() => setDeleting(null)}>
          <p className="text-sm text-[var(--gsb-muted)]">{t('business.deleteConfirm')}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={dangerButtonClass}
              onClick={async () => {
                try {
                  await deactivateBusiness(deleting.id)
                  notify({ title: t('toast.deleted') })
                  setDeleting(null)
                } catch (error) {
                  notifyError(t('toast.error'), error)
                }
              }}
            >
              {t('common.delete')}
            </button>
            <button type="button" className={ghostButtonClass} onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </button>
          </div>
        </Modal>
      ) : null}

      {baysFor ? (
        <BaysModal business={baysFor} canWrite={canWriteBays} onClose={() => setBaysFor(null)} />
      ) : null}
    </div>
  )
}

function BusinessCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (payload: CreateBusinessPayload) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [address, setAddress] = useState('')
  const [district, setDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !slug.trim() || !address.trim() || !city.trim() || !state.trim()) return
    setSaving(true)
    try {
      await onCreate({
        name: name.trim(),
        slug: slug.trim(),
        address: address.trim(),
        district: district || undefined,
        postalCode: postalCode || undefined,
        city: city.trim(),
        state: state.trim(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('business.createTitle')} onClose={onClose}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void handleSave(event)}>
        <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
          {t('common.name')}
          <input
            className={`${inputClass} mt-1`}
            value={name}
            onChange={(event) => {
              const next = event.target.value
              setName(next)
              if (!slugTouched) setSlug(slugFromName(next))
            }}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
          {t('business.slug')}
          <input
            className={`${inputClass} mt-1`}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true)
              setSlug(event.target.value)
            }}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
          {t('business.address')}
          <input className={`${inputClass} mt-1`} value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.district')}
          <input className={`${inputClass} mt-1`} value={district} onChange={(event) => setDistrict(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.postalCode')}
          <input
            className={`${inputClass} mt-1`}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.city')}
          <input className={`${inputClass} mt-1`} value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.state')}
          <input className={`${inputClass} mt-1`} value={state} onChange={(event) => setState(event.target.value)} />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className={primaryButtonClass} disabled={saving}>
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

function BusinessEditModal({
  business,
  onClose,
  onSave,
}: {
  business: Business
  onClose: () => void
  onSave: (
    payload: Partial<Pick<Business, 'name' | 'address' | 'district' | 'postalCode' | 'city' | 'state'>>,
  ) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [name, setName] = useState(business.name)
  const [address, setAddress] = useState(business.address)
  const [district, setDistrict] = useState(business.district ?? '')
  const [postalCode, setPostalCode] = useState(business.postalCode ?? '')
  const [city, setCity] = useState(business.city)
  const [state, setState] = useState(business.state)
  const [saving, setSaving] = useState(false)

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await onSave({ name, address, district, postalCode, city, state })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('business.editTitle')} onClose={onClose}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void handleSave(event)}>
        <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)] sm:col-span-2">
          {t('business.address')}
          <input className={`${inputClass} mt-1`} value={address} onChange={(event) => setAddress(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.district')}
          <input className={`${inputClass} mt-1`} value={district} onChange={(event) => setDistrict(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.postalCode')}
          <input
            className={`${inputClass} mt-1`}
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.city')}
          <input className={`${inputClass} mt-1`} value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('business.state')}
          <input className={`${inputClass} mt-1`} value={state} onChange={(event) => setState(event.target.value)} />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {t('common.save')}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
