import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, TrashBin } from '@gravity-ui/icons'
import { useBusinessStore } from '@/presentation/stores/businessStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import type { BusinessMember } from '@/domain/business/Business'
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
} from '@/presentation/components/admin/AdminUi'

export function StaffPage() {
  const { t } = useTranslation('admin')
  const members = useBusinessStore((state) => state.members)
  const roles = useBusinessStore((state) => state.roles)
  const loading = useBusinessStore((state) => state.loading)
  const error = useBusinessStore((state) => state.error)
  const loadStaff = useBusinessStore((state) => state.loadStaff)
  const addMember = useBusinessStore((state) => state.addMember)
  const updateMember = useBusinessStore((state) => state.updateMember)
  const canWrite = useAuthStore((state) => state.hasPermission('members:write'))
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessMember | null>(null)
  const [deleting, setDeleting] = useState<BusinessMember | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (activeBusinessId) void loadStaff()
  }, [loadStaff, activeBusinessId])

  const filtered = useMemo(
    () =>
      members.filter((member) =>
        matchesQuery([member.user.name, member.user.email, member.role.name], search),
      ),
    [members, search],
  )
  const pageState = usePagination(filtered, `${search}:${activeBusinessId ?? ''}`)

  return (
    <div>
      <PageHeader
        title={t('staff.title')}
        subtitle={t('staff.subtitle')}
        actions={canWrite ? <PrimaryAction label={t('staff.new')} onClick={() => setCreateOpen(true)} /> : null}
      />
      {error ? <ErrorBanner message={error} onRetry={() => void loadStaff()} retryLabel={t('common.retry')} /> : null}
      <ListToolbar search={search} onSearchChange={setSearch} searchLabel={t('common.search')} />
      {loading && members.length === 0 ? (
        <p className="text-sm text-[var(--gsb-muted)]">{t('common.loading')}</p>
      ) : pageState.total === 0 ? (
        <EmptyState message={t('common.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--gsb-muted)]">
              <tr>
                <th className="px-4 py-3">{t('common.name')}</th>
                <th>{t('common.email')}</th>
                <th>{t('common.role')}</th>
                <th className="px-4">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageState.items.map((member) => (
                <tr key={member.id} className="border-t border-[var(--gsb-border)]">
                  <td className="px-4 py-3">
                    <p>{member.user.name}</p>
                    <StatusBadge label={member.isActive ? t('common.active') : t('common.inactive')} />
                  </td>
                  <td>{member.user.email}</td>
                  <td>
                    <StatusBadge label={member.role.name} />
                  </td>
                  <td className="px-4 py-3">
                    {canWrite ? (
                      <div className="flex flex-wrap gap-2">
                        <IconButton label={t('common.edit')} onClick={() => setEditing(member)}>
                          <Pencil className="size-4" />
                        </IconButton>
                        {member.isActive ? (
                          <IconButton
                            label={t('common.delete')}
                            tone="danger"
                            onClick={() => setDeleting(member)}
                          >
                            <TrashBin className="size-4" />
                          </IconButton>
                        ) : null}
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

      {createOpen ? (
        <StaffCreateModal
          roles={roles}
          onClose={() => setCreateOpen(false)}
          onCreate={async (payload) => {
            try {
              await addMember(payload)
              notify({ title: t('toast.created') })
              setCreateOpen(false)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {editing ? (
        <StaffEditModal
          member={editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            try {
              await updateMember(editing.userId, payload)
              notify({ title: t('toast.updated') })
              setEditing(null)
            } catch (error) {
              notifyError(t('toast.error'), error)
            }
          }}
        />
      ) : null}

      {deleting ? (
        <Modal title={t('staff.deleteTitle')} onClose={() => setDeleting(null)}>
          <p className="text-sm text-[var(--gsb-muted)]">{t('staff.deleteConfirm')}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className={dangerButtonClass}
              onClick={async () => {
                try {
                  await updateMember(deleting.userId, { isActive: false })
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

function StaffCreateModal({
  roles,
  onClose,
  onCreate,
}: {
  roles: { id: string; name: string }[]
  onClose: () => void
  onCreate: (payload: { email: string; name?: string; password?: string; roleId: string }) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || !roleId) return
    setSaving(true)
    try {
      await onCreate({
        email,
        name: name || undefined,
        password: password || undefined,
        roleId,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('staff.new')} onClose={onClose}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void handleCreate(event)}>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.email')}
          <input
            className={`${inputClass} mt-1`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.password')}
          <input
            className={`${inputClass} mt-1`}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.role')}
          <select className={`${inputClass} mt-1`} value={roleId} onChange={(event) => setRoleId(event.target.value)}>
            <option value="">—</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
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

function StaffEditModal({
  member,
  roles,
  onClose,
  onSave,
}: {
  member: BusinessMember
  roles: { id: string; name: string }[]
  onClose: () => void
  onSave: (payload: { name: string; roleId: string }) => Promise<void>
}) {
  const { t } = useTranslation('admin')
  const [name, setName] = useState(member.user.name)
  const [roleId, setRoleId] = useState(member.roleId)
  const [saving, setSaving] = useState(false)

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!roleId) return
    setSaving(true)
    try {
      await onSave({ name, roleId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('staff.edit')} onClose={onClose}>
      <form className="grid gap-3" onSubmit={(event) => void handleSave(event)}>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.name')}
          <input className={`${inputClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="text-xs text-[var(--gsb-muted)]">
          {t('common.role')}
          <select className={`${inputClass} mt-1`} value={roleId} onChange={(event) => setRoleId(event.target.value)}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
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
