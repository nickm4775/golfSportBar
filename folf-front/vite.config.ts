import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

const killSwitchSw = `
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  })());
});
`

const staleSwCleanupScript = `
(function () {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (sessionStorage.getItem('gsb-sw-reloaded') === '1') return;
    sessionStorage.setItem('gsb-sw-reloaded', '1');
    location.reload();
  });

  var controlled = Boolean(navigator.serviceWorker.controller);
  if (!controlled) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      registrations.forEach(function (registration) {
        registration.unregister();
      });
    });
    return;
  }

  if (sessionStorage.getItem('gsb-sw-kill') === '1') return;
  sessionStorage.setItem('gsb-sw-kill', '1');
  navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(function () {});
})();
`

const SW_KILL_PATHS = new Set(['/sw.js', '/service-worker.js', '/dev-sw.js'])

function killStaleServiceWorker(): Plugin {
  let isDevServer = false

  return {
    name: 'gsb-kill-stale-sw',
    configureServer(server) {
      isDevServer = true
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0]
        if (!pathname || !SW_KILL_PATHS.has(pathname)) {
          next()
          return
        }

        res.setHeader('Content-Type', 'application/javascript')
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('Service-Worker-Allowed', '/')
        res.end(killSwitchSw)
      })
    },
    transformIndexHtml() {
      if (!isDevServer) {
        return
      }

      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          children: staleSwCleanupScript,
        },
      ]
    },
  }
}

const apiProxy = {
  '/api': {
    target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3000',
    changeOrigin: true,
  },
  '/connection': {
    target: process.env.VITE_CENTRIFUGO_PROXY_TARGET ?? 'http://localhost:8000',
    changeOrigin: true,
    ws: true,
  },
}

export default defineConfig({
  plugins: [
    killStaleServiceWorker(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      devOptions: { enabled: false },
      includeAssets: ['favicon.svg', 'icons.svg'],
      pwaAssets: {
        image: 'public/favicon.svg',
        preset: 'minimal-2023',
        overrideManifestIcons: true,
        includeHtmlHeadLinks: true,
        injectThemeColor: false,
      },
      manifest: {
        name: 'Golf Sport Bar',
        short_name: 'Golf Sport Bar',
        description:
          'Golf indoor com física realista, partidas com amigos, gastronomia e drinks em Balneário Camboriú.',
        lang: 'pt',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'browser'],
        orientation: 'any',
        background_color: '#f7f8f6',
        theme_color: '#143528',
        categories: ['food', 'sports', 'lifestyle'],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2,webmanifest}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/connection\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/images\/.*\.(png|jpe?g|webp|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gsb-images',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    host: true,
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
    proxy: apiProxy,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
    proxy: apiProxy,
  },
})
