import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ptCommon from './locales/pt/common.json'
import ptHero from './locales/pt/hero.json'
import ptSimulator from './locales/pt/simulator.json'
import ptMenu from './locales/pt/menu.json'
import ptStores from './locales/pt/stores.json'
import ptAuth from './locales/pt/auth.json'
import ptAdmin from './locales/pt/admin.json'

import esCommon from './locales/es/common.json'
import esHero from './locales/es/hero.json'
import esSimulator from './locales/es/simulator.json'
import esMenu from './locales/es/menu.json'
import esStores from './locales/es/stores.json'
import esAuth from './locales/es/auth.json'
import esAdmin from './locales/es/admin.json'

import enCommon from './locales/en/common.json'
import enHero from './locales/en/hero.json'
import enSimulator from './locales/en/simulator.json'
import enMenu from './locales/en/menu.json'
import enStores from './locales/en/stores.json'
import enAuth from './locales/en/auth.json'
import enAdmin from './locales/en/admin.json'

import itCommon from './locales/it/common.json'
import itHero from './locales/it/hero.json'
import itSimulator from './locales/it/simulator.json'
import itMenu from './locales/it/menu.json'
import itStores from './locales/it/stores.json'
import itAuth from './locales/it/auth.json'
import itAdmin from './locales/it/admin.json'

import zhCommon from './locales/zh/common.json'
import zhHero from './locales/zh/hero.json'
import zhSimulator from './locales/zh/simulator.json'
import zhMenu from './locales/zh/menu.json'
import zhStores from './locales/zh/stores.json'
import zhAuth from './locales/zh/auth.json'
import zhAdmin from './locales/zh/admin.json'

export const supportedLocales = ['pt', 'es', 'en', 'it', 'zh'] as const
export type AppLocale = (typeof supportedLocales)[number]

export const localeLabels: Record<AppLocale, string> = {
  pt: 'Português',
  es: 'Español',
  en: 'English',
  it: 'Italiano',
  zh: '中文',
}

export const LOCALE_STORAGE_KEY = 'gsb-locale'

function resolveInitialLocale(): AppLocale {
  if (typeof window === 'undefined') return 'pt'
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && supportedLocales.includes(stored as AppLocale)) {
    return stored as AppLocale
  }
  return 'pt'
}

void i18n.use(initReactI18next).init({
  lng: resolveInitialLocale(),
  fallbackLng: 'pt',
  defaultNS: 'common',
  ns: ['common', 'hero', 'simulator', 'menu', 'stores', 'auth', 'admin'],
  resources: {
    pt: {
      common: ptCommon,
      hero: ptHero,
      simulator: ptSimulator,
      menu: ptMenu,
      stores: ptStores,
      auth: ptAuth,
      admin: ptAdmin,
    },
    es: {
      common: esCommon,
      hero: esHero,
      simulator: esSimulator,
      menu: esMenu,
      stores: esStores,
      auth: esAuth,
      admin: esAdmin,
    },
    en: {
      common: enCommon,
      hero: enHero,
      simulator: enSimulator,
      menu: enMenu,
      stores: enStores,
      auth: enAuth,
      admin: enAdmin,
    },
    it: {
      common: itCommon,
      hero: itHero,
      simulator: itSimulator,
      menu: itMenu,
      stores: itStores,
      auth: itAuth,
      admin: itAdmin,
    },
    zh: {
      common: zhCommon,
      hero: zhHero,
      simulator: zhSimulator,
      menu: zhMenu,
      stores: zhStores,
      auth: zhAuth,
      admin: zhAdmin,
    },
  },
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') return
  if (supportedLocales.includes(lng as AppLocale)) {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lng)
  }
  document.documentElement.lang = lng
})

export default i18n
