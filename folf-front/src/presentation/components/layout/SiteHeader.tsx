import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'
import { LocaleSwitcher, ThemeSwitch } from '@/presentation/components/chrome/LocaleAndTheme'
import { useAuthStore } from '@/presentation/stores/authStore'

export function SiteHeader() {
  const { t } = useTranslation('common')
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated')

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[color-mix(in_oklab,var(--gsb-bg)_78%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <a href="#top" className="shrink-0" aria-label="Golf Sport Bar">
          <BrandLogo compact />
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <a className="text-[13px] text-[var(--gsb-muted)] transition hover:text-[var(--gsb-fg)]" href="#simulator">
            {t('nav.simulator')}
          </a>
          <a className="text-[13px] text-[var(--gsb-muted)] transition hover:text-[var(--gsb-fg)]" href="#menu">
            {t('nav.menu')}
          </a>
          <a className="text-[13px] text-[var(--gsb-muted)] transition hover:text-[var(--gsb-fg)]" href="#stores">
            {t('nav.locations')}
          </a>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <LocaleSwitcher />
          <ThemeSwitch />
          <Link
            to={isAuthenticated ? '/app/dashboard' : '/login'}
            className="rounded-full border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--gsb-fg)] transition hover:border-[var(--gsb-accent)]"
          >
            {t('nav.staff')}
          </Link>
        </div>
      </div>
    </header>
  )
}
