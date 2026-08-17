import { Button, Dropdown, Label, Switch } from '@heroui/react'
import type { Selection } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'
import { useTheme } from '@/app/providers/ThemeProvider'
import {
  localeLabels,
  supportedLocales,
  type AppLocale,
} from '@/infrastructure/i18n/i18n'

function resolveLocale(language: string): AppLocale {
  const base = language.split('-')[0] as AppLocale
  return supportedLocales.includes(base) ? base : 'pt'
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" />
    </svg>
  )
}

export function SiteHeader() {
  const { t, i18n } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  const currentLocale = resolveLocale(i18n.language)
  const isDark = theme === 'dark'

  const handleLocaleChange = (keys: Selection) => {
    if (keys === 'all') return
    const next = [...keys][0]
    if (next == null) return
    const locale = String(next)
    if (supportedLocales.includes(locale as AppLocale)) {
      void i18n.changeLanguage(locale)
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[color-mix(in_oklab,var(--gsb-bg)_78%,transparent)] backdrop-blur-2xl">
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
          <Dropdown>
            <Button
              aria-label={t('language')}
              className="h-8 min-h-8 rounded-full border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 text-xs font-medium tracking-wide text-[var(--gsb-fg)]"
            >
              {currentLocale.toUpperCase()}
            </Button>
            <Dropdown.Popover className="min-w-[10rem]">
              <Dropdown.Menu
                selectedKeys={new Set([currentLocale])}
                selectionMode="single"
                onSelectionChange={handleLocaleChange}
              >
                {supportedLocales.map((locale) => (
                  <Dropdown.Item key={locale} id={locale} textValue={localeLabels[locale]}>
                    <Dropdown.ItemIndicator />
                    <Label>{localeLabels[locale]}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Switch
            isSelected={isDark}
            onChange={(selected) => setTheme(selected ? 'dark' : 'light')}
            aria-label={t('theme.toggle')}
            className="gsb-theme-switch"
          >
            {({ isSelected }) => (
              <Switch.Content className="cursor-pointer">
                <Switch.Control className="gsb-theme-switch-control border border-[var(--gsb-border)] bg-[color-mix(in_oklab,var(--gsb-accent-soft)_35%,var(--gsb-surface))] data-[selected=true]:bg-[var(--gsb-accent)] data-[selected]:bg-[var(--gsb-accent)]">
                  <Switch.Thumb className="gsb-theme-switch-thumb bg-white shadow-sm">
                    <Switch.Icon>
                      {isSelected ? (
                        <SunIcon className="size-3 text-[var(--gsb-accent)]" />
                      ) : (
                        <MoonIcon className="size-3 text-[var(--gsb-muted)]" />
                      )}
                    </Switch.Icon>
                  </Switch.Thumb>
                </Switch.Control>
              </Switch.Content>
            )}
          </Switch>
        </div>
      </div>
    </header>
  )
}
