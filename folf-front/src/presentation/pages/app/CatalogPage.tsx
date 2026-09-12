import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, TrashBin } from '@gravity-ui/icons'
import { formatBrl } from '@/shared/lib/formatBrl'
import { useCatalogStore } from '@/presentation/stores/catalogStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import type { MenuItem, PrepStation } from '@/domain/catalog/Catalog'
import { notify, notifyError } from '@/presentation/lib/notify'
import { matchesQuery } from '@/presentation/components/admin/admin.utils'
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
  textareaClass,
} from '@/presentation/components/admin/AdminUi'

export function CatalogPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const menu = useCatalogStore((state) => state.menu)
  const loading = useCatalogStore((state) => state.loading)
  const error = useCatalogStore((state) => state.error)
  const load = useCatalogStore((state) => state.load)
  const createProduct = useCatalogStore((state) => state.createProduct)
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const deleteProduct = useCatalogStore((state) => state.deleteProduct)
  const canWrite = useAuthStore((state) => state.hasPermission('catalog:write'))
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [deleting, setDeleting] = useState<MenuItem | null>(null)

  useEffect(() => {
    if (activeBusinessId) void load()
  }, [load, activeBusinessId])

  const filtered = useMemo(() => {
    if (!menu) return []
    return menu.items.filter((item) => {
      const inCategory = category ? item.category === category : true
      return inCategory && matchesQuery([item.name, item.categoryName, item.description], search)
    })
  }, [menu, category, search])
  const pageState = usePagination(filtered, `${category}:${search}:${activeBusinessId ?? ''}`)

  return (
    <div>
      <PageHeader
        title={t('catalog.title')}
        subtitle={t('catalog.subtitle')}
        actions={
          canWrite ? <PrimaryAction label={t('catalog.new')} onClick={() => setCreateOpen(true)} /> : null
        }
      />
      {error ? <ErrorBanner message={error} onRetry={() => void load()} retryLabel={t('common.retry')} /> : null}

      <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')}>
        {menu?.categories.length ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={category === '' ? primaryButtonClass : ghostButtonClass}
              onClick={() => setCategory('')}
            >
              {t('common.all')}
            </button>
            {menu.categories.map((item) => (
              <button
                key={item.id}
                type="button"
                className={category === item.slug ? primaryButtonClass : ghostButtonClass}
                onClick={() => setCategory(item.slug)}
              >
                {item.namePt}
              </button>
            ))}
          </div>
        ) : null}
      </ListToolbar>

      {loading && !menu ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
              <tr>
                <th className="px-4 py-3">{t('orders.product')}</th>
                <th>{t('catalog.category')}</th>
                <th>{t('common.price')}</th>
                <th className="px-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageState.items.map((item) => (
                <tr key={item.id} className="border-t border-[var(--gsb-border)]">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    <StatusBadge
                      label={item.isAvailable ? t('common.available') : t('common.unavailable')}
                    />
                  </td>
                  <td>{item.categoryName}</td>
                  <td>{formatBrl(item.priceBrl, locale)}</td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <div className="flex flex-wrap gap-2">
                        <IconButton label={t('common.edit')} onClick={() => setEditing(item)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          label={t('common.delete')}
                          tone="danger"
                          onClick={() => setDeleting(item)}
                        >
                          <TrashBin className="size-4" />
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

      {createOpen && menu ? (
        <ProductFormModal
          title={t('catalog.new')}
          submitLabel={t('common.create')}
          categories={menu.categories}
          initial={{
            name: '',
            description: '',
            categoryId: menu.categories[0]?.id ?? '',
            priceBrl: '',
            imageSrc: '',
            featured: false,
            isAvailable: true,
            prepStation: '',
          }}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (payload) => {
            try {
              await createProduct({
                name: payload.name,
                description: payload.description || undefined,
                categoryId: payload.categoryId,
                priceBrl: payload.priceBrl,
                imageSrc: payload.imageSrc || undefined,
                featured: payload.featured,
                isAvailable: payload.isAvailable,
                prepStation: payload.prepStation,
              })
              notify({ title: t('toast.created') })
              setCreateOpen(false)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {editing && menu ? (
        <ProductFormModal
          title={t('catalog.edit')}
          submitLabel={t('common.save')}
          categories={menu.categories}
          initial={{
            name: editing.name,
            description: editing.description,
            categoryId: menu.categories.find((item) => item.slug === editing.category)?.id ?? '',
            priceBrl: String(editing.priceBrl),
            imageSrc: editing.imageSrc,
            featured: editing.featured,
            isAvailable: editing.isAvailable,
            prepStation: editing.productPrepStation ?? '',
          }}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            try {
              await updateProduct(editing.id, payload)
              notify({ title: t('toast.updated') })
              setEditing(null)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {deleting ? (
        <Modal title={t('catalog.deleteTitle')} onClose={() => setDeleting(null)}>
          <p className="text-sm text-[var(--gsb-muted)]">{t('catalog.deleteConfirm')}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={dangerButtonClass}
              onClick={async () => {
                try {
                  await deleteProduct(deleting.id)
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
    </div>
  )
}

function ProductFormModal({
  title,
  submitLabel,
  categories,
  initial,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  categories: { id: string; namePt: string }[]
  initial: {
    name: string
    description: string
    categoryId: string
    priceBrl: string
    imageSrc: string
    featured: boolean
    isAvailable: boolean
    prepStation: string
  }
  onClose: () => void
  onSubmit: (payload: {
    name: string
    description: string
    categoryId: string
    priceBrl: number
    imageSrc: string
    featured: boolean
    isAvailable: boolean
    prepStation: PrepStation | null
  }) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const uploadProductImage = useCatalogStore((state) => state.uploadProductImage)
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [categoryId, setCategoryId] = useState(initial.categoryId)
  const [priceBrl, setPriceBrl] = useState(initial.priceBrl)
  const [imageSrc, setImageSrc] = useState(initial.imageSrc)
  const [featured, setFeatured] = useState(initial.featured)
  const [isAvailable, setIsAvailable] = useState(initial.isAvailable)
  const [prepStation, setPrepStation] = useState(initial.prepStation)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingImage(true)
    try {
      const url = await uploadProductImage(file)
      setImageSrc(url)
      notify({ title: t('toast.updated') })
    } catch (error) {
      notifyError(t('toast.error'), error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const price = Number(priceBrl)
    if (!name.trim() || !categoryId || !Number.isFinite(price) || price < 0) return
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        description,
        categoryId,
        priceBrl: price,
        imageSrc,
        featured,
        isAvailable,
        prepStation: prepStation === 'KITCHEN' || prepStation === 'BAR' ? prepStation : null,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.description')}
          <textarea
            className={`${textareaClass} mt-1`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('catalog.category')}
          <select
            className={`${inputClass} mt-1`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.namePt}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('catalog.prepStation')}
          <select
            className={`${inputClass} mt-1`}
            value={prepStation}
            onChange={(event) => setPrepStation(event.target.value)}
          >
            <option value="">{t('catalog.prepStationDefault')}</option>
            <option value="KITCHEN">{t('catalog.prepStationKitchen')}</option>
            <option value="BAR">{t('catalog.prepStationBar')}</option>
          </select>
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.price')}
          <input
            className={`${inputClass} mt-1`}
            type="number"
            min="0"
            step="0.01"
            value={priceBrl}
            onChange={(event) => setPriceBrl(event.target.value)}
          />
        </label>
        <div className="text-xs text-[var(--gsb-muted)]">
          {t('common.image')}
          <div className="mt-1 flex items-center gap-3">
            {imageSrc ? (
              <img
                src={imageSrc}
                className="h-20 w-20 rounded-lg border border-[var(--gsb-border)] object-cover"
                alt=""
              />
            ) : null}
            <label className={`${ghostButtonClass} cursor-pointer`}>
              {uploadingImage ? t('common.loading') : t('common.image')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingImage}
                onChange={(event) => void handleImageSelect(event)}
              />
            </label>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--gsb-fg)]">
          <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
          {t('common.featured')}
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--gsb-fg)]">
          <input type="checkbox" checked={isAvailable} onChange={(event) => setIsAvailable(event.target.checked)} />
          {t('common.available')}
        </label>
        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClass} disabled={saving || uploadingImage}>
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
