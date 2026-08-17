export function formatBrl(value: number, locale: string): string {
  const localeMap: Record<string, string> = {
    pt: 'pt-BR',
    es: 'es-ES',
    en: 'en-US',
    it: 'it-IT',
    zh: 'zh-CN',
  }

  return new Intl.NumberFormat(localeMap[locale] ?? 'pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
