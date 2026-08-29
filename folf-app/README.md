# folf-app

App cliente Flutter (Golf Sport Bar).

## Configuración de entorno

Las URLs se inyectan con `--dart-define` (ver [`lib/core/config/app_config.dart`](lib/core/config/app_config.dart)).

| Variable | Default (dev) | Producción |
|----------|---------------|------------|
| `API_BASE_URL` | `http://127.0.0.1:3000/api/v1` | `https://golfsportbar.com.br/api/v1` |
| `MENU_ASSET_BASE_URL` | `http://127.0.0.1:5173` | `https://golfsportbar.com.br` |
| `REALTIME_WS_URL` | (derivado de la API) | opcional; si vacío → `wss://golfsportbar.com.br/connection/websocket` |

### Desarrollo

```bash
flutter run
```

### Producción (Hostinger / golfsportbar.com.br)

```bash
flutter run \
  --dart-define=API_BASE_URL=https://golfsportbar.com.br/api/v1 \
  --dart-define=MENU_ASSET_BASE_URL=https://golfsportbar.com.br
```

Build de release:

```bash
flutter build apk \
  --dart-define=API_BASE_URL=https://golfsportbar.com.br/api/v1 \
  --dart-define=MENU_ASSET_BASE_URL=https://golfsportbar.com.br

flutter build ios \
  --dart-define=API_BASE_URL=https://golfsportbar.com.br/api/v1 \
  --dart-define=MENU_ASSET_BASE_URL=https://golfsportbar.com.br
```

El WebSocket se deduce solo: en HTTPS usa el mismo host (Caddy); en local con API en `:3000` usa `:8000`.
