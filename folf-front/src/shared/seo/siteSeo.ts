import { brandAssets } from '@/shared/brand/assets'
import { brandContact } from '@/shared/brand/contact'
import { storeCatalog } from '@/infrastructure/store/storeCatalog'

export const SITE_URL = 'https://golfsportbar.com.br' as const
export const SITE_NAME = 'Golf Sport Bar' as const

export const DEFAULT_TITLE =
  'Golf Sport Bar | Simulador de Golfe Indoor em Balneário Camboriú' as const

export const DEFAULT_DESCRIPTION =
  'Simulador de golfe indoor com física realista, bays privativos, gastronomia e drinks no Centro de Balneário Camboriú — R. 3600, N205. Reserve sua partida.' as const

export const SITE_LOGO = brandAssets.logoOnLight
export const DEFAULT_OG_IMAGE = brandAssets.ogImage
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const SITE_LOGO_WIDTH = 1024
export const SITE_LOGO_HEIGHT = 820

const primaryStore = storeCatalog[0]

export const siteAddress = {
  streetAddress: primaryStore.address,
  addressLocality: primaryStore.city,
  addressRegion: primaryStore.state,
  postalCode: primaryStore.postalCode,
  addressCountry: 'BR',
  district: primaryStore.district,
} as const

export const siteGeo = {
  latitude: primaryStore.lat,
  longitude: primaryStore.lng,
} as const

export const siteTelephone = brandContact.phoneE164
export const siteTelephoneDisplay = brandContact.phoneDisplay
export const siteSameAs = [brandContact.instagramUrl] as const

export function absoluteUrl(path = '/'): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

export function buildLocalBusinessJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SportsActivityLocation', 'BarOrPub'],
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(SITE_LOGO),
      width: SITE_LOGO_WIDTH,
      height: SITE_LOGO_HEIGHT,
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: DEFAULT_DESCRIPTION,
    telephone: `+${siteTelephone}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${siteAddress.streetAddress}, ${siteAddress.district}`,
      addressLocality: siteAddress.addressLocality,
      addressRegion: siteAddress.addressRegion,
      postalCode: siteAddress.postalCode,
      addressCountry: siteAddress.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteGeo.latitude,
      longitude: siteGeo.longitude,
    },
    sameAs: [...siteSameAs],
  }
}
