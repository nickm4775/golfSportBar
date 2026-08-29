# folf-print-agent

Agente local de impresión térmica para Golf Sport Bar (modo **AGENT**).

Usalo cuando el backend (`folf-back`) corre en la nube y las impresoras ESC/POS están en la LAN del bar (router, puerto típico `9100`).

## Requisitos

- Node.js 20+
- Equipo siempre encendido en la misma LAN que las impresoras (Raspberry Pi, mini-PC o PC de caja)
- Cuenta staff del negocio con `business:read` (p. ej. OWNER/MANAGER)
- En `/app/settings` del panel: modo **Agente local (nube)**

## Configuración

```bash
cp .env.example .env
```

Variables:

| Variable | Descripción |
|----------|-------------|
| `API_URL` | API pública, p. ej. `https://golfsportbar.com.br/api/v1` |
| `CENTRIFUGO_WS` | WebSocket Centrifugo, p. ej. `wss://golfsportbar.com.br/connection/websocket` |
| `BUSINESS_ID` | UUID del negocio |
| `AGENT_EMAIL` / `AGENT_PASSWORD` | Credenciales staff |
| `HEARTBEAT_MS` | Intervalo de presencia/probe (default 45000) |

### Producción (Hostinger)

```env
API_URL=https://golfsportbar.com.br/api/v1
CENTRIFUGO_WS=wss://golfsportbar.com.br/connection/websocket
```

### Desarrollo local

```env
API_URL=http://localhost:3000/api/v1
CENTRIFUGO_WS=ws://localhost:8000/connection/websocket
```

## Uso

```bash
npm install
npm run start:dev
# o
npm run build && npm start
```

El agente:

1. Hace login y se suscribe a `business:{BUSINESS_ID}`
2. Procesa `print.jobs.created`, `print.discover.request`, `print.probe.request`
3. Envía heartbeat + estado ONLINE/OFFLINE de impresoras configuradas
4. Revisa jobs `PENDING` al arrancar y cada 30s

## Modo DIRECT

Si el backend está en la misma LAN que las impresoras, elegí **Servidor (misma red)** en settings y **no** hace falta este agente.
