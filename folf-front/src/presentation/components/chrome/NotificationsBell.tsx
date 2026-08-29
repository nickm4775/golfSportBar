import { Button, Dropdown } from '@heroui/react'
import { Bell } from '@gravity-ui/icons'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useNotificationsStore } from '@/presentation/stores/notificationsStore'
import { useAuthStore } from '@/presentation/stores/authStore'
import { formatDateTime } from '@/presentation/components/admin/admin.utils'

export function NotificationsBell() {
  const { t, i18n } = useTranslation('admin')
  const locale = i18n.language.split('-')[0]
  const canView = useAuthStore((state) => state.hasPermission('business:read'))
  const items = useNotificationsStore((state) => state.items)
  const markRead = useNotificationsStore((state) => state.markRead)
  const unread = items.filter((item) => !item.read).length
  const preview = items.slice(0, 6)

  if (!canView) return null

  return (
    <Dropdown>
      <Button
        aria-label={t('nav.notifications')}
        className="relative h-9 min-h-9 w-9 min-w-9 rounded-full border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-0 text-[var(--gsb-fg)]"
      >
        <Bell className="size-4" />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-[var(--gsb-accent)] px-1 text-[10px] leading-4 font-medium text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>
      <Dropdown.Popover className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-[var(--gsb-border)] px-3 py-2">
          <p className="text-sm font-medium">{t('notifications.title')}</p>
          <Link
            to="/app/notifications"
            className="text-xs text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)]"
          >
            {t('notifications.viewAll')}
          </Link>
        </div>
        {preview.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-[var(--gsb-muted)]">
            {t('notifications.empty')}
          </p>
        ) : (
          <ul className="max-h-80 overflow-auto">
            {preview.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-[color-mix(in_oklab,var(--gsb-fg)_6%,transparent)]"
                  onClick={() => markRead(item.id)}
                >
                  <p className={`text-sm ${item.read ? 'text-[var(--gsb-muted)]' : 'font-medium'}`}>
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="line-clamp-2 text-xs text-[var(--gsb-muted)]">{item.description}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-[var(--gsb-muted)]">
                    {formatDateTime(item.createdAt, locale)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown.Popover>
    </Dropdown>
  )
}
