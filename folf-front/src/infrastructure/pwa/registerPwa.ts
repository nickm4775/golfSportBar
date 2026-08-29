import { registerSW } from 'virtual:pwa-register'

async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
}

export function registerPwa() {
  if (import.meta.env.DEV) {
    void unregisterServiceWorkers()
    return
  }

  registerSW({ immediate: true })
}
