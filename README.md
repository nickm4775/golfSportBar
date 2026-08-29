# FOLF — Golf Sport Bar

Monorepo con frontend público (React/Vite) y backend de gestión (NestJS/PostgreSQL).

## Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| **Backend (API)** | `3000` | http://localhost:3000/api/v1 |
| **Swagger** | `3000` | http://localhost:3000/api/docs |
| **Frontend (Vite)** | `5173` | http://localhost:5173 |
| **Redis** | `6379` | redis://localhost:6379 |
| **Centrifugo** | `8000` | http://localhost:8000 |

La API y Swagger viven **solo en el backend** (puerto 3000). En desarrollo, Vite proxyea `/api` a `localhost:3000`. En Docker, el front corre con `npm run preview` y el mismo proxy hacia `backend:3000`. Panel staff: http://localhost:5173/login

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
- Poné `RUN_DB_SEED=true` solo en el **primer** deploy
- `BACKEND_PORT=3000` y `FRONTEND_PORT=5173` (defaults de Vite)

```bash
docker compose up -d --build
```

### CI/CD (actualización automática)

Cada push a `main` construye y publica imágenes en GHCR. En el servidor, Watchtower las aplica sin rebuild local:

```bash
# Primer arranque en producción (incluye Watchtower)
docker compose --profile prod up -d
```

Si los paquetes de GHCR son privados, completá `GHCR_USER` y `GHCR_TOKEN` (PAT con `read:packages`) en `.env`. Postgres no lo actualiza Watchtower.

### Producción con dominio

1. Apuntá el DNS de tu dominio a la IP del servidor.
2. Opcional: colocá Caddy, Traefik o nginx + Certbot delante de los puertos publicados.
3. Configurá `CORS_ORIGINS=http://localhost:5173,https://tudominio.com` si el front consume la API.

### Comandos útiles

```bash
docker compose logs -f          # logs de todos los servicios
docker compose logs -f backend  # solo backend
docker compose ps               # estado
docker compose down             # detener
docker compose up -d --build    # rebuild y levantar
```

## Proyectos

| Carpeta | Descripción | Docs |
|---------|-------------|------|
| [`folf-front/`](folf-front/) | Sitio público PWA | [`folf-front/README.md`](folf-front/README.md) |
| [`folf-back/`](folf-back/) | API multi-tenant | [`folf-back/README.md`](folf-back/README.md) |

## Desarrollo local

```bash
# Terminal 1 — PostgreSQL, Redis y Centrifugo
cd folf-back && npm run docker:up

# Terminal 2 — Backend (puerto 3000)
cd folf-back && npm run start:dev

# Terminal 3 — Frontend (puerto 5173)
cd folf-front && npm run dev
```
