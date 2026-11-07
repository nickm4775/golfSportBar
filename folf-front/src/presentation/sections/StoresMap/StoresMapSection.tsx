import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Button } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { services } from '@/app/compositionRoot'
import type { StoreLocation } from '@/domain/store/StoreLocation'
import { mapStyles } from '@/infrastructure/map/mapTiles'
import { useTheme } from '@/app/providers/ThemeProvider'
import { brandContact } from '@/shared/brand/contact'

function createMarkerIcon(isDark: boolean) {
  const fill = isDark ? '#3db56a' : '#1f6b3a'
  const stroke = '#f7f8f6'
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <path fill="${fill}" stroke="${stroke}" stroke-width="2" d="M20 1C10.6 1 3 8.6 3 18c0 12.4 17 32 17 32s17-19.6 17-32C37 8.6 29.4 1 20 1z"/>
      <circle cx="20" cy="18" r="7" fill="${stroke}"/>
    </svg>`,
  )

  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -44],
    className: 'gsb-map-marker',
  })
}

function ThemeTiles({ isDark }: { isDark: boolean }) {
  const map = useMap()

  useEffect(() => {
    const layer = maplibreGL({ style: isDark ? mapStyles.dark : mapStyles.light }).addTo(map)
    map.invalidateSize()
    return () => {
      layer.remove()
    }
  }, [map, isDark])

  return null
}

function FitStores({ stores }: { stores: readonly StoreLocation[] }) {
  const map = useMap()

  useEffect(() => {
    if (stores.length === 0) return
    if (stores.length === 1) {
      map.setView([stores[0].lat, stores[0].lng], 16)
      return
    }
    const bounds = L.latLngBounds(stores.map((store) => [store.lat, store.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48] })
  }, [map, stores])

  return null
}

function formatStoreLine(store: StoreLocation): string {
  return `${store.address} - ${store.district}, ${store.city} - ${store.state}, ${store.postalCode}`
}

export function StoresMapSection() {
  const { t } = useTranslation('stores')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [stores, setStores] = useState<readonly StoreLocation[]>([])
  const markerIcon = useMemo(() => createMarkerIcon(isDark), [isDark])

  useEffect(() => {
    void services.getStores.execute().then(setStores)
  }, [])

  const center: [number, number] = stores[0]
    ? [stores[0].lat, stores[0].lng]
    : [-27.001654891900937, -48.622958970800916]

  return (
    <section id="stores" className="relative py-28 md:py-36">
      <div className="mx-auto max-w-4xl px-4 text-center md:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--gsb-accent-soft)]">
          {t('eyebrow')}
        </p>
        <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl lg:text-7xl">
          {t('title')}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[var(--gsb-muted)] md:text-lg">{t('subtitle')}</p>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-4 md:mt-16 md:px-8">
        <div className="overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem]">
          <div className="h-[min(65vh,520px)] w-full">
            {stores.length > 0 ? (
              <MapContainer
                center={center}
                zoom={16}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <ThemeTiles isDark={isDark} />
                <FitStores stores={stores} />
                {stores.map((store) => (
                  <Marker key={store.id} position={[store.lat, store.lng]} icon={markerIcon}>
                    <Popup>
                      <div className="space-y-1 p-1">
                        <strong>{t(store.nameKey)}</strong>
                        <p>
                          {formatStoreLine(store)}
                          <br />
                          {store.country}
                        </p>
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${store.lat}&mlon=${store.lng}#map=18/${store.lat}/${store.lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('openMap')}
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="flex h-full items-center justify-center bg-[var(--gsb-surface)] text-[var(--gsb-muted)]">
                …
              </div>
            )}
          </div>
        </div>

        <ul className="mt-12 space-y-10">
          {stores.map((store) => (
            <li key={store.id} className="flex flex-col items-start gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="font-display text-2xl font-semibold md:text-3xl">{t(store.nameKey)}</h3>
                <p className="mt-2 text-[var(--gsb-muted)]">
                  {formatStoreLine(store)}
                  <br />
                  {store.country}
                </p>
                <div className="mt-4 flex flex-col gap-1 text-sm text-[var(--gsb-muted)]">
                  <a
                    className="text-[var(--gsb-fg)] transition hover:text-[var(--gsb-accent)]"
                    href={`tel:+${brandContact.phoneE164}`}
                  >
                    {brandContact.phoneDisplay}
                  </a>
                  <a
                    className="text-[var(--gsb-fg)] transition hover:text-[var(--gsb-accent)]"
                    href={brandContact.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {brandContact.instagramHandle}
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  className="rounded-full bg-[var(--gsb-accent)] text-white"
                  onPress={() => {
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        formatStoreLine(store),
                      )}`,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }}
                >
                  {t('directions')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
