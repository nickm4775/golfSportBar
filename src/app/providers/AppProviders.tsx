import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/infrastructure/i18n/i18n'
import { ThemeProvider } from './ThemeProvider'

function DocumentLangSync({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18nInstance.language
  }, [i18nInstance.language])

  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <DocumentLangSync>{children}</DocumentLangSync>
      </ThemeProvider>
    </I18nextProvider>
  )
}
