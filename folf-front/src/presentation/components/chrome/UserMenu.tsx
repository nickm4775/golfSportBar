import { Avatar, Button, Dropdown, Label } from '@heroui/react'
import { ArrowRightFromSquare } from '@gravity-ui/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/presentation/stores/authStore'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function UserMenu() {
  const { t } = useTranslation('admin')
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  if (!user) return null

  return (
    <Dropdown>
      <Button
        aria-label={t('shell.account')}
        className="h-9 min-h-9 w-9 min-w-9 rounded-full border border-[var(--gsb-border)] bg-[var(--gsb-surface)] p-0"
      >
        <Avatar className="size-8">
          <Avatar.Fallback className="text-[11px] font-medium">
            {initials(user.name || user.email)}
          </Avatar.Fallback>
        </Avatar>
      </Button>
      <Dropdown.Popover className="min-w-[14rem]">
        <div className="border-b border-[var(--gsb-border)] px-3 py-2">
          <p className="truncate text-sm font-medium text-[var(--gsb-fg)]">{user.name}</p>
          <p className="truncate text-xs text-[var(--gsb-muted)]">{user.email}</p>
        </div>
        <Dropdown.Menu
          onAction={(key) => {
            if (String(key) === 'logout') logout()
          }}
        >
          <Dropdown.Item id="logout" textValue={t('shell.logout')} variant="danger">
            <ArrowRightFromSquare className="size-4" />
            <Label>{t('shell.logout')}</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
