import { NavLink, Outlet, useLocation, Navigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'
import { LocaleSwitcher, ThemeSwitch } from '@/presentation/components/chrome/LocaleAndTheme'
import { UserMenu } from '@/presentation/components/chrome/UserMenu'
import { NotificationsBell } from '@/presentation/components/chrome/NotificationsBell'
import { AppDocumentSeo } from '@/presentation/components/seo/DocumentSeo'
import { useAuthStore } from '@/presentation/stores/authStore'
import { useUiStore } from '@/presentation/stores/uiStore'
import { filterNavItems } from '@/presentation/lib/appNav'

export function ProtectedApp() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return (
      <>
        <AppDocumentSeo />
        <div className="flex min-h-dvh items-center justify-center bg-[var(--gsb-bg)]">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--gsb-accent-soft)] opacity-40" />
        </div>
      </>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <AppShell />
}

function AppShell() {
  const { t } = useTranslation('admin')
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const businesses = user?.businesses ?? []
  const activeBusinessId = useAuthStore((state) => state.activeBusinessId)
  const setActiveBusiness = useAuthStore((state) => state.setActiveBusiness)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const collapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  const items = filterNavItems(user?.permissions ?? [], businesses.length)
  const showNotifications = hasPermission('business:read')

  const allowWithoutBusiness =
    location.pathname.startsWith('/app/business') ||
    location.pathname.startsWith('/app/notifications')

  return (
    <div className="flex min-h-dvh bg-[var(--gsb-bg)] text-[var(--gsb-fg)]">
      <AppDocumentSeo />
      <aside
        className={`sticky top-0 flex h-dvh flex-col border-r border-[var(--gsb-border)] bg-[var(--gsb-surface)] pt-[env(safe-area-inset-top)] transition-[width] ${
          collapsed ? 'w-[4.5rem]' : 'w-60'
        }`}
      >
        <div className={`flex items-center gap-2 px-3 py-4 ${collapsed ? 'justify-center' : ''}`}>
          <Link to="/" aria-label="Golf Sport Bar">
            <BrandLogo compact mark={collapsed} />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2" aria-label={t('nav.dashboard')}>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-[color-mix(in_oklab,var(--gsb-accent)_16%,transparent)] text-[var(--gsb-fg)]'
                      : 'text-[var(--gsb-muted)] hover:bg-[color-mix(in_oklab,var(--gsb-fg)_6%,transparent)] hover:text-[var(--gsb-fg)]'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={t(item.key)}
              >
                <Icon className="size-4 shrink-0" />
                {collapsed ? null : t(item.key)}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          className="m-2 rounded-xl px-3 py-2 text-left text-xs text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)]"
          onClick={toggleSidebar}
        >
          {collapsed ? t('shell.expand') : t('shell.collapse')}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--gsb-border)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6">
          <div className="min-w-0">
            {businesses.length > 1 ? (
              <label className="text-xs text-[var(--gsb-muted)]">
                {t('shell.business')}
                <select
                  className="ml-2 rounded-lg border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-2 py-1 text-sm text-[var(--gsb-fg)]"
                  value={activeBusinessId ?? ''}
                  onChange={(event) => setActiveBusiness(event.target.value)}
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="truncate text-sm font-medium">
                {businesses[0]?.name ?? t('shell.noBusiness')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link to="/" className="hidden text-xs text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)] sm:inline">
              {t('shell.backToSite')}
            </Link>
            <LocaleSwitcher />
            <ThemeSwitch />
            {showNotifications ? <NotificationsBell /> : null}
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
          {activeBusinessId || allowWithoutBusiness ? (
            <Outlet />
          ) : (
            <p className="text-sm text-[var(--gsb-muted)]">{t('shell.noBusiness')}</p>
          )}
        </main>
      </div>
    </div>
  )
}
