import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, TrashBin } from '@gravity-ui/icons'
import { services } from '@/app/compositionRoot'
import type { Bay } from '@/domain/gspro/Gspro'
import type { Business } from '@/domain/business/Business'
import { notify, notifyError } from '@/presentation/lib/notify'
import { matchesQuery } from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'
import {
  EmptyState,
  ErrorBanner,
  IconButton,
  ListToolbar,
  Modal,
  PaginationBar,
  PrimaryAction,
  StatusBadge,
  dangerButtonClass,
  ghostButtonClass,
  inputClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'

export function BaysModal({
  business,
  canWrite,
  onClose,
}: {
  business: Business
  canWrite: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('admin')
  const [bays, setBays] = useState<Bay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Bay | null>(null)
  const [deleting, setDeleting] = useState<Bay | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setBays(await services.gspro.listBays(business.id, true))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [business.id, t])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () => bays.filter((bay) => matchesQuery([bay.code, bay.name], search)),
    [bays, search],
  )
  const pageState = usePagination(filtered, search)

  return (
    <>
      <Modal title={`${t('business.baysTitle')} · ${business.name}`} onClose={onClose} wide>
        {error ? (
          <ErrorBanner message={error} onRetry={() => void load()} retryLabel={t('common.retry')} />
        ) : null}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-56 flex-1">
            <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')} />
          </div>
          {canWrite ? <PrimaryAction label={t('bays.new')} onClick={() => setCreateOpen(true)} /> : null}
        </div>
        {loading && bays.length === 0 ? (
          <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
        ) : pageState.total === 0 ? (
          <EmptyState message={t('common.empty')} />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {pageState.items.map((bay) => (
              <li
                key={bay.id}
                className="rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-4"
              >
                <p className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">{bay.code}</p>
                <p className="mt-1 font-display text-2xl">{bay.name}</p>
                <div className="mt-3">
                  <StatusBadge label={bay.isActive ? t('common.active') : t('common.inactive')} />
                </div>
                {canWrite ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <IconButton label={t('common.edit')} onClick={() => setEditing(bay)}>
                      <Pencil className="size-4" />
                    </IconButton>
                    {bay.isActive ? (
                      <IconButton
                        label={t('common.delete')}
                        tone="danger"
                        onClick={() => setDeleting(bay)}
                      >
                        <TrashBin className="size-4" />
                      </IconButton>
                    ) : null}
                  </div>
                ) : null}
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
      </Modal>
      {createOpen ? (
        <BayFormModal
          title={t('bays.new')}
          submitLabel={t('common.create')}
          initial={{ code: '', name: '', isActive: true }}
          showActive={false}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            try {
              await services.gspro.createBay(business.id, { code: payload.code, name: payload.name })
              notify({ title: t('toast.created') })
              setCreateOpen(false)
              await load()
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}
      {editing ? (
        <BayFormModal
          title={t('bays.edit')}
          submitLabel={t('common.save')}
          initial={editing}
          showActive
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            try {
              await services.gspro.updateBay(business.id, editing.id, payload)
              notify({ title: t('toast.updated') })
              setEditing(null)
              await load()
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}
      {deleting ? (
        <Modal title={t('bays.deleteTitle')} onClose={() => setDeleting(null)}>
          <p className="text-sm text-[var(--gsb-muted)]">{t('bays.deleteConfirm')}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={dangerButtonClass}
              onClick={async () => {
                try {
                  await services.gspro.updateBay(business.id, deleting.id, { isActive: false })
                  notify({ title: t('toast.deleted') })
                  setDeleting(null)
                  await load()
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
    </>
  )
}

function BayFormModal({
  title,
  submitLabel,
  initial,
  showActive,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  initial: { code: string; name: string; isActive: boolean }
  showActive: boolean
  onClose: () => void
  onSubmit: (payload: { code: string; name: string; isActive?: boolean }) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [code, setCode] = useState(initial.code)
  const [name, setName] = useState(initial.name)
  const [isActive, setIsActive] = useState(initial.isActive)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim() || !name.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        ...(showActive ? { isActive } : {}),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('bays.code')}
          <input className={`${inputClass} mt-1`} value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        {showActive ? (
          <label className="flex items-center gap-2 text-sm text-[var(--gsb-fg)]">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            {t('common.active')}
          </label>
        ) : null}
        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClass} disabled={saving}>
            {submitLabel}
          </button>
          <button type="button" className={ghostButtonClass} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
