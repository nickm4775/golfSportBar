# FOLF — Golf Sport Bar

Monorepo con frontend público (React/Vite) y backend de gestión (NestJS/PostgreSQL).

## Puertos

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| **Caddy (edge)** | `80` / `443` | Único ingreso público (TLS) |
| **Backend (API)** | `3000` | Solo red Docker → `https://dominio/api` |
| **Frontend (Vite)** | `5173` | Solo red Docker → `https://dominio/` |
| **Redis** | `6379` | Solo red Docker |
| **Centrifugo** | `8000` | Solo red Docker → `wss://dominio/connection` |

Producción (`golfsportbar.com.br`):

| Qué | URL |
|-----|-----|
| Sitio + panel | https://golfsportbar.com.br |
| API | https://golfsportbar.com.br/api/v1 |
| Swagger | https://golfsportbar.com.br/api/docs |
| WebSocket | wss://golfsportbar.com.br/connection/websocket |
| Login staff | https://golfsportbar.com.br/login |

En desarrollo local (sin Caddy): API en http://localhost:3000, front en http://localhost:5173 (Vite proxyea `/api` y `/connection`).

## Despliegue con Docker

### Requisitos

- Docker Engine 24+
- Docker Compose v2

### Pasos

```bash
cp .env.example .env
```

Editá `.env`:

- Cambiá `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CENTRIFUGO_API_KEY` y `CENTRIFUGO_TOKEN_HMAC_SECRET`
- `SITE_ADDRESS=golfsportbar.com.br` (producción) o `localhost` (prueba local con Caddy)
- `CORS_ORIGINS=https://golfsportbar.com.br`
- Poné `RUN_DB_SEED=true` solo en el **primer** deploy

```bash
docker compose up -d --build
```

El tráfico público entra por **Caddy** (`deploy/caddy/Caddyfile`): `/` → frontend, `/api` → backend, `/connection` → Centrifugo.

### CI/CD (actualización automática)

Cada push a `main` construye y publica imágenes en GHCR. En el servidor, Watchtower las aplica sin rebuild local:

```bash
# Primer arranque en producción (incluye Watchtower)
docker compose --profile prod up -d
```

Si los paquetes de GHCR son privados, completá `GHCR_USER` y `GHCR_TOKEN` (PAT con `read:packages`) en `.env`. Postgres no lo actualiza Watchtower.

### Producción Hostinger (VPS)

DNS, firewall, secretos y verificación: ver **[deploy/HOSTINGER.md](deploy/HOSTINGER.md)**.

Resumen:

1. DNS `A` `@` y `www` → IP del VPS (`179.199.136.83`)
2. Firewall: solo **22, 80, 443**
3. `.env` con secretos + `CORS_ORIGINS=https://golfsportbar.com.br`
4. `docker compose --profile prod up -d`
5. Tras el seed: `RUN_DB_SEED=false` y recrear backend

### Comandos útiles

```bash
docker compose logs -f          # logs de todos los servicios
docker compose logs -f backend  # solo backend
docker compose logs -f caddy    # TLS / proxy
docker compose ps               # estado
docker compose down             # detener
docker compose up -d --build    # rebuild y levantar
```

## Proyectos

| Carpeta | Descripción | Docs |
|---------|-------------|------|
| [`folf-front/`](folf-front/) | Sitio público PWA | [`folf-front/README.md`](folf-front/README.md) |
| [`folf-back/`](folf-back/) | API multi-tenant | [`folf-back/README.md`](folf-back/README.md) |
| [`folf-print-agent/`](folf-print-agent/) | Impresión ESC/POS en LAN del bar | [`folf-print-agent/README.md`](folf-print-agent/README.md) |

## Desarrollo local

```bash
# Terminal 1 — PostgreSQL, Redis y Centrifugo
cd folf-back && npm run docker:up

# Terminal 2 — Backend (puerto 3000)
cd folf-back && npm run start:dev

# Terminal 3 — Frontend (puerto 5173)
cd folf-front && npm run dev
```
