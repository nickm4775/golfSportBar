# Runbook — Hostinger VPS (`golfsportbar.com.br`)

Despliegue del stack FOLF en el VPS Hostinger **179.199.136.83** con un solo dominio: front, API y WebSocket detrás de Caddy (HTTPS).

## 1. DNS

En el panel DNS del dominio `golfsportbar.com.br`:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `@` | `179.199.136.83` |
| A | `www` | `179.199.136.83` |

Esperá propagación (minutos a horas). Sin DNS correcto, Let’s Encrypt no emite certificado.

Comprobar:

```bash
dig +short golfsportbar.com.br
# debe devolver 179.199.136.83
```

## 2. Firewall

Abrí solo:

- **22** — SSH
- **80** — HTTP (challenge ACME + redirect)
- **443** — HTTPS

No publiques 3000, 5173, 6379 ni 8000 (ya no se exponen en `docker-compose.yml`).

Ejemplo con `ufw`:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

## 3. Docker en el VPS

SSH al servidor (`root` o usuario con sudo):

```bash
curl -fsSL https://get.docker.com | sh
docker compose version
```

## 4. Código y `.env`

```bash
sudo mkdir -p /opt/golfsportbar
sudo chown "$USER":"$USER" /opt/golfsportbar
cd /opt/golfsportbar

# Opción A — clone (repo privado: configurá SSH key o token)
git clone <URL_DEL_REPO> .

# Opción B — desde tu máquina
# rsync -avz --exclude node_modules --exclude .git ./ user@179.199.136.83:/opt/golfsportbar/

cp .env.example .env
nano .env
```

Valores obligatorios en producción:

```env
SITE_ADDRESS=golfsportbar.com.br
CORS_ORIGINS=https://golfsportbar.com.br
POSTGRES_PASSWORD=<secreto-fuerte>
DATABASE_URL=postgresql://folf:<mismo-secreto>@postgres:5432/folf?schema=public
JWT_ACCESS_SECRET=<min-32-chars>
JWT_REFRESH_SECRET=<min-32-chars>
CENTRIFUGO_API_KEY=<secreto>
CENTRIFUGO_TOKEN_HMAC_SECRET=<min-32-chars>
RUN_DB_SEED=true
```

Cambiá también las contraseñas `SEED_*` si vas a usar esas cuentas.

Si las imágenes GHCR son privadas:

```env
GHCR_USER=<github-user>
GHCR_TOKEN=<PAT con read:packages>
```

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

## 5. Primer arranque

```bash
cd /opt/golfsportbar
docker compose --profile prod up -d
docker compose ps
docker compose logs -f caddy backend
```

Caddy pedirá el certificado a Let’s Encrypt automáticamente.

Tras el primer boot exitoso (migraciones + seed):

```bash
# En .env
RUN_DB_SEED=false

docker compose --profile prod up -d --force-recreate backend
```

## 6. Verificación

```bash
curl -I https://golfsportbar.com.br
curl -s https://golfsportbar.com.br/api/v1/health || true
# Swagger en el navegador:
# https://golfsportbar.com.br/api/docs
```

Checklist manual:

- [ ] Sitio carga en HTTPS
- [ ] `www` redirige a apex
- [ ] Login staff (`/login`)
- [ ] Panel y datos en tiempo real (WebSocket)
- [ ] Swagger responde

## 7. Actualizaciones

Push a `main` → CI publica imágenes en GHCR → Watchtower (perfil `prod`) recrea `backend` y `frontend` cada ~300s.

Para forzar pull manual:

```bash
docker compose --profile prod pull backend frontend
docker compose --profile prod up -d
```

## 8. Print agent (LAN del bar, no en el VPS)

En el PC/Pi de caja, `.env` del agente:

```env
API_URL=https://golfsportbar.com.br/api/v1
CENTRIFUGO_WS=wss://golfsportbar.com.br/connection/websocket
BUSINESS_ID=<uuid>
AGENT_EMAIL=<staff>
AGENT_PASSWORD=<secreto>
```

Ver [`folf-print-agent/README.md`](../folf-print-agent/README.md).

## 9. App Flutter (builds de producción)

```bash
cd folf-app
flutter build apk \
  --dart-define=API_BASE_URL=https://golfsportbar.com.br/api/v1 \
  --dart-define=MENU_ASSET_BASE_URL=https://golfsportbar.com.br
```

El WS queda en `wss://golfsportbar.com.br/connection/websocket` (mismo origen). Ver [`folf-app/README.md`](../folf-app/README.md).

## Troubleshooting

| Síntoma | Qué mirar |
|---------|-----------|
| Caddy no obtiene cert | DNS aún no apunta al VPS; puertos 80/443 bloqueados |
| 502 en `/api` | `docker compose logs backend` — DB, migraciones |
| CORS en browser | `CORS_ORIGINS=https://golfsportbar.com.br` |
| WS falla | `deploy/centrifugo/config.json` → `allowed_origins`; logs `centrifugo` / `caddy` |
| GHCR pull denied | `docker login ghcr.io` + `GHCR_*` en `.env` |
