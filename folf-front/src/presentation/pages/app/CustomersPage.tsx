import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from '@gravity-ui/icons'
import type { Customer } from '@/domain/customer/Customer'
import { useCustomersStore } from '@/presentation/stores/customersStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { notify, notifyError } from '@/presentation/lib/notify'
import { matchesQuery } from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'
import { CustomerForm } from '@/presentation/components/admin/CustomerForm'
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
} from '@/presentation/components/admin/AdminUi'

export function CustomersPage() {
  const { t } = useTranslation('admin')
  const items = useCustomersStore((state) => state.items)
  const loading = useCustomersStore((state) => state.loading)
  const error = useCustomersStore((state) => state.error)
  const load = useCustomersStore((state) => state.load)
  const create = useCustomersStore((state) => state.create)
  const update = useCustomersStore((state) => state.update)
  const getById = useCustomersStore((state) => state.getById)
  const canWrite = useAuthStore((state) => state.hasPermission('customers:write'))
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  useEffect(() => {
    if (activeBusinessId) void load()
  }, [load, activeBusinessId])

  const filtered = useMemo(
    () => items.filter((customer) => matchesQuery([customer.fullName, customer.email, customer.phone, customer.cpf], search)),
    [items, search],
  )
  const pageState = usePagination(filtered, `${search}:${activeBusinessId ?? ''}`)

  return (
    <div>
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        actions={
          canWrite ? <PrimaryAction label={t('customers.new')} onClick={() => setCreateOpen(true)} /> : null
        }
      />
      {error ? <ErrorBanner message={error} onRetry={() => void load()} retryLabel={t('common.retry')} /> : null}
      <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')} />
      {loading && items.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
              <tr>
                <th className="px-4 py-3">{t('customers.fullName')}</th>
                <th>{t('customers.cpf')}</th>
                <th>{t('common.phone')}</th>
                <th>{t('common.email')}</th>
                <th className="px-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageState.items.map((customer) => (
                <tr key={customer.id} className="border-t border-[var(--gsb-border)]">
                  <td className="px-4 py-3">
                    <p>{customer.fullName}</p>
                    <StatusBadge label={customer.isActive ? t('common.active') : t('common.inactive')} />
                  </td>
                  <td>{customer.cpf}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email}</td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <IconButton
                        label={t('common.edit')}
                        onClick={() => {
                          void getById(customer.id)
                            .then(setEditing)
                            .catch((error) => notifyError(t('toast.error'), error))
                        }}
                      >
                        <Pencil className="size-4" />
                      </IconButton>
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

      {createOpen ? (
        <Modal title={t('customers.new')} onClose={() => setCreateOpen(false)} wide>
          <CustomerForm
            submitLabel={t('common.create')}
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (payload) => {
              try {
                await create(payload)
                notify({ title: t('toast.created') })
                setCreateOpen(false)
              } catch (error) {
                notifyError(t('toast.error'), error)
              }
            }}
          />
        </Modal>
      ) : null}

      {editing ? (
        <Modal title={t('customers.edit')} onClose={() => setEditing(null)} wide>
          <CustomerForm
            initial={editing}
            submitLabel={t('common.save')}
            onCancel={() => setEditing(null)}
            onSubmit={async (payload) => {
              try {
                const { lgpdAccepted: _lgpd, ...rest } = payload
                await update(editing.id, rest)
                notify({ title: t('toast.updated') })
                setEditing(null)
              } catch (error) {
                notifyError(t('toast.error'), error)
              }
            }}
          />
        </Modal>
      ) : null}
    </div>
  )
}
