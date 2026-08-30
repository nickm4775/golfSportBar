import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { BrandLogo } from '@/presentation/components/brand/BrandLogo'
import { LocaleSwitcher, ThemeSwitch } from '@/presentation/components/chrome/LocaleAndTheme'
import { LoginDocumentSeo } from '@/presentation/components/seo/DocumentSeo'
import { useAuthStore } from '@/presentation/stores/authStore'
import { ApiError } from '@/infrastructure/http/apiClient'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const location = useLocation()
  const status = useAuthStore((state) => state.status)
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'idle' || status === 'loading') {
    return (
      <>
        <LoginDocumentSeo />
        <div className="flex min-h-dvh items-center justify-center bg-[var(--gsb-bg)]">
          <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--gsb-accent-soft)] opacity-40" />
        </div>
      </>
    )
  }

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from
    return (
      <>
        <LoginDocumentSeo />
        <Navigate to={from && from.startsWith('/app') ? from : '/app/dashboard'} replace />
      </>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError(t('required'))
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
    } catch (caught) {
      if (caught instanceof ApiError && caught.statusCode === 401) {
        setError(t('invalidCredentials'))
      } else {
        setError(t('genericError'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gsb-atmosphere flex min-h-dvh">
      <LoginDocumentSeo />
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--gsb-accent)_28%,transparent),transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandLogo />
          <p className="max-w-sm font-display text-4xl leading-tight text-[var(--gsb-fg)]">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-between px-6 py-8 sm:px-10 lg:w-[28rem] lg:border-l lg:border-[var(--gsb-border)]">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="lg:hidden">
            <BrandLogo compact />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeSwitch />
          </div>
        </div>

        <form className="mx-auto w-full max-w-sm py-12" onSubmit={(event) => void handleSubmit(event)}>
          <h1 className="font-display text-4xl text-[var(--gsb-fg)]">{t('title')}</h1>
          <p className="mt-2 text-sm text-[var(--gsb-muted)] lg:hidden">{t('subtitle')}</p>

          <label className="mt-8 block text-xs font-medium uppercase tracking-wider text-[var(--gsb-muted)]">
            {t('email')}
            <input
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 text-sm text-[var(--gsb-fg)] outline-none ring-[var(--gsb-accent)] focus:ring-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-[var(--gsb-muted)]">
            {t('password')}
            <input
              autoComplete="current-password"
              className="mt-2 h-11 w-full rounded-xl border border-[var(--gsb-border)] bg-[var(--gsb-surface)] px-3 text-sm text-[var(--gsb-fg)] outline-none ring-[var(--gsb-accent)] focus:ring-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            isDisabled={submitting}
            className="mt-8 h-11 w-full rounded-full bg-[var(--gsb-accent)] text-sm font-medium text-white"
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </form>

        <Link to="/" className="text-center text-sm text-[var(--gsb-muted)] hover:text-[var(--gsb-fg)]">
          {t('backHome')}
        </Link>
      </div>
    </div>
  )
}
