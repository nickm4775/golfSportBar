import { LogoAndroid } from '@gravity-ui/icons'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'
import { brandContact } from '@/shared/brand/contact'

export function SiteFooter() {
  const { t } = useTranslation('common')
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--gsb-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-14 md:flex-row md:items-end md:px-8">
        <div>
          <BrandLogo compact />
          <p className="mt-3 text-sm text-[var(--gsb-muted)]">{t('footer.tagline')}</p>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <a
              className="text-[var(--gsb-muted)] transition hover:text-[var(--gsb-accent)]"
              href={brandContact.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('instagram')} {brandContact.instagramHandle}
            </a>
            <a
              className="text-[var(--gsb-muted)] transition hover:text-[var(--gsb-accent)]"
              href={brandContact.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('phone')}: {brandContact.phoneDisplay}
            </a>
            <a
              className="inline-flex items-center gap-2 text-[var(--gsb-muted)] transition hover:text-[var(--gsb-accent)]"
              href={brandContact.androidApkUrl}
              target="_blank"
              rel="noreferrer"
            >
              <LogoAndroid className="size-4 shrink-0" />
              {t('downloadAndroid')}
            </a>
          </div>
        </div>
        <p className="text-sm text-[var(--gsb-muted)]">
          © {year} Golf Sport Bar. {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
