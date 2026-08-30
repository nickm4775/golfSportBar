# FOLF Backend API

Backend multi-tenant para gestión de bares, carta de productos, pedidos y operación GSPro.

## Documentación Swagger (OpenAPI)

La documentación interactiva de la API está en **Swagger UI**:

| Entorno | URL |
|---------|-----|
| Desarrollo local | http://localhost:3000/api/docs |
| Producción (Caddy) | https://golfsportbar.com.br/api/docs |

Desde Swagger podés:

- Ver todos los endpoints agrupados por módulo
- Probar requests en vivo con **Try it out**
- Autenticarte con **Authorize** usando el token JWT

### Flujo rápido en Swagger

1. Abrí `/api/docs`
2. `POST /api/v1/auth/login` con `admin@folf.local` / `Admin123!` — o registro propio
3. Copiá el `accessToken` de la respuesta
4. Clic en **Authorize** → pegá: `Bearer <token>`
5. Probá `GET /api/v1/auth/me` o endpoints de negocio si tenés membership

> Usuarios registrados empiezan sin negocios; un admin debe agregarlos vía `POST /businesses/:businessId/members`.

### Exportar OpenAPI JSON

Con el servidor corriendo:

```bash
curl http://localhost:3000/api/docs-json -o openapi.json
```

---

## Stack

| Tecnología | Uso |
|------------|-----|
| NestJS 11 | Framework HTTP |
| TypeScript | Lenguaje |
| PostgreSQL 16 | Base de datos |
| Redis 7 | Caché de analytics y engine de Centrifugo |
| Centrifugo 6 | WebSocket en tiempo real |
| TypeORM 0.3 | ORM y migraciones |
| JWT | Autenticación |
| Swagger / OpenAPI 3 | Documentación de la API |

---

## Despliegue con Docker

Stack completo desde la raíz del monorepo (Caddy en `:80`/`:443`):

```bash
cp .env.example .env
docker compose up -d --build
# Producción + Watchtower:
docker compose --profile prod up -d
```

| Servicio | URL (producción) |
|----------|------------------|
| Frontend | https://golfsportbar.com.br |
| API | https://golfsportbar.com.br/api/v1 |
| **Swagger** | **https://golfsportbar.com.br/api/docs** |
| WebSocket | wss://golfsportbar.com.br/connection/websocket |

Ver [README principal](../README.md), [runbook Hostinger](../deploy/HOSTINGER.md) y [`.env.example`](../.env.example).

---

## Desarrollo local

```bash
cd folf-back
cp .env.example .env
npm install
npm run docker:up
npm run db:migrate
npm run db:seed
npm run start:dev
```

- API: http://localhost:3000/api/v1
- **Swagger: http://localhost:3000/api/docs**

---

## Arquitectura

```
Organization → Business (tenant) → staff, carta, pedidos, GSPro
```

Guards por endpoint de negocio: `JwtAuthGuard` → `BusinessContextGuard` → `PermissionsGuard`

### Roles

`ADMIN` · `OWNER` · `MANAGER` · `WAITER` · `COOK` · `BARTENDER`

### Módulos Swagger

| Tag | Descripción |
|-----|-------------|
| auth | Registro, login, perfil |
| organizations | Organizaciones del admin |
| businesses | Negocios y staff |
| roles | RBAC |
| catalog | Carta por negocio |
| orders | Pedidos |
| gspro | Bays, reservas, sesiones |

---

## Usuarios demo (seed)

### Golf Sport Bar

| Rol | Email | Password |
|-----|-------|----------|
| **Admin** | admin@folf.local | Admin123! |
| Owner | owner@folf.local | Owner123! |
| Manager | manager@folf.local | Manager123! |
| Waiter (camarero) | waiter@folf.local | Waiter123! |
| Cook (cocinero) | cook@folf.local | Cook123! |
| Bartender | bartender@folf.local | Bartender123! |
| **Cliente (folf-app)** | customer@folf.local | Customer123! |

El seed **limpia toda la base** (`TRUNCATE … CASCADE`) y solo deja: roles/permisos, usuarios, organización + negocio, carta vinculada y **3 bays**. Sin pedidos, reservas ni clientes demo.

En producción: `RUN_DB_SEED=true` solo en el primer arranque (o cuando quieras resetear datos); después `false`.

---

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Desarrollo + Swagger en `/api/docs` |
| `npm run build` | Compilar producción |
| `npm run export:menu` | Exportar carta GSB del front |
| `npm run parse:gsb-carta` | Parsear carta GSB → `menu-catalog.json` |
| `npm run db:migrate` | Migraciones |
| `npm run db:seed` | Poblar DB (Golf Sport Bar) |
| `npm run test` | Tests unitarios |

---

## Seed de productos

```bash
npm run parse:gsb-carta
npm run db:seed
```

Fuente GSB: [`menu-catalog.json`](src/database/seed/menu-catalog.json) · carta en [`carta.txt`](../carta.txt) (cuando aplique) / [`menuCatalog.ts`](../folf-front/src/infrastructure/menu/menuCatalog.ts)
