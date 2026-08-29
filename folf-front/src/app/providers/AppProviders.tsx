import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Toast } from '@heroui/react'
import { I18nextProvider, useTranslation } from 'react-i18next'
import i18n from '@/infrastructure/i18n/i18n'
import { ThemeProvider } from './ThemeProvider'
import { RealtimeProvider } from './RealtimeProvider'
import { useAuthStore } from '@/presentation/stores/authStore'

function DocumentLangSync({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation()

  useEffect(() => {
    document.documentElement.lang = i18nInstance.language
  }, [i18nInstance.language])

  return children
}

function AuthHydrate({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return children
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <Toast.Provider placement="top end" />
        <DocumentLangSync>
          <AuthHydrate>
            <RealtimeProvider />
            {children}
          </AuthHydrate>
        </DocumentLangSync>
      </ThemeProvider>
    </I18nextProvider>
  )
}
