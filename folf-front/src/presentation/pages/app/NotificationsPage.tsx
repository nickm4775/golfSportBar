import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, TrashBin } from '@gravity-ui/icons'
import { useNotificationsStore } from '@/presentation/stores/notificationsStore'
import {
  EmptyState,
  IconButton,
  PageHeader,
  PaginationBar,
  ghostButtonClass,
  primaryButtonClass,
} from '@/presentation/components/admin/AdminUi'
import { formatDateTime } from '@/presentation/components/admin/admin.utils'
import { usePagination } from '@/presentation/components/admin/usePagination'

export function NotificationsPage() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const items = useNotificationsStore((state) => state.items)
  const markRead = useNotificationsStore((state) => state.markRead)
  const markAllRead = useNotificationsStore((state) => state.markAllRead)
  const clear = useNotificationsStore((state) => state.clear)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const filtered = useMemo(
    () => (unreadOnly ? items.filter((item) => !item.read) : items),
    [items, unreadOnly],
  )
  const pageState = usePagination(filtered, `${unreadOnly}:${filtered.length}`)

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ghostButtonClass} onClick={markAllRead}>
              {t('notifications.markAllRead')}
            </button>
            <button type="button" className={primaryButtonClass} onClick={clear}>
              <TrashBin className="size-4" />
              {t('notifications.clear')}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={unreadOnly ? ghostButtonClass : primaryButtonClass}
          onClick={() => setUnreadOnly(false)}
        >
          {t('common.all')}
        </button>
        <button
          type="button"
          className={unreadOnly ? primaryButtonClass : ghostButtonClass}
          onClick={() => setUnreadOnly(true)}
        >
          {t('notifications.unread')}
        </button>
      </div>

      {pageState.total === 0 ? (
        <EmptyState message={t('notifications.empty')} />
      ) : (
        <ul className="divide-y divide-[var(--gsb-border)] overflow-hidden rounded-2xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)]">
          {pageState.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className={item.read ? 'text-sm text-[var(--gsb-muted)]' : 'text-sm font-medium'}>
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1 text-sm text-[var(--gsb-muted)]">{item.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-[var(--gsb-muted)]">
                  {formatDateTime(item.createdAt, locale)}
                </p>
              </div>
              {item.read ? null : (
                <IconButton label={t('notifications.markRead')} onClick={() => markRead(item.id)}>
                  <Check className="size-4" />
                </IconButton>
              )}
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
    </div>
  )
}
