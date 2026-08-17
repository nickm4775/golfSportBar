# Golf Sport Bar

Landing premium para la cadena **Golf Sport Bar** (React + Vite + TypeScript + Tailwind CSS + HeroUI + GSAP + Leaflet).

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Arquitectura

Clean Architecture / SOLID:

- `src/domain` — entidades e interfaces
- `src/application` — casos de uso
- `src/infrastructure` — datos estáticos, i18n, tiles del mapa
- `src/presentation` — UI, secciones y animaciones
- `src/app` — composition root y providers

## Características

- PWA instalable (standalone, service worker, cache de app shell e imágenes)
- Animaciones estilo Apple con GSAP ScrollTrigger
- Light / dark mode
- i18n: Português (default), Español, English, Italiano, 中文
- Mapa Leaflet multi-sede (hoy: R. 3600, 235 — Centro, Balneário Camboriú, 88330-248)

Para probar la PWA en local: `npm run build && npm run preview` (el service worker no se registra en `npm run dev`).
