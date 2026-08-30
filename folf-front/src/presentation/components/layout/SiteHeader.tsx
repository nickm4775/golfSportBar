import { LogoAndroid } from '@gravity-ui/icons'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'
import { LocaleSwitcher, ThemeSwitch } from '@/presentation/components/chrome/LocaleAndTheme'
import { brandContact } from '@/shared/brand/contact'

export function SiteHeader() {
  const { t } = useTranslation('common')
  const downloadLabel = t('downloadAndroid')

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
          <a
            href={brandContact.androidApkUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={downloadLabel}
            title={downloadLabel}
            className="inline-flex size-8 items-center justify-center rounded-full text-[var(--gsb-muted)] transition hover:text-[var(--gsb-accent)]"
          >
            <LogoAndroid className="size-4" />
          </a>
          <LocaleSwitcher />
          <ThemeSwitch />
        </div>
      </div>
    </header>
  )
}
