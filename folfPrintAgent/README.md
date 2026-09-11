# Negocenda Print Agent (bandeja)

Helper ligero para Windows / macOS / Linux. Corre en segundo plano, recibe trabajos de impresión del backend Negocenda e imprime tickets térmicos ESC/POS.

El modal de `/dashboard/empresas` **solo administra** (código, rutas, prueba). Este programa es el que imprime.

## Requisitos

- PC en la misma LAN que las impresoras de red, **o** impresora USB conectada, **o** Bluetooth ya emparejado
- Backend Negocenda accesible (URL del API)
- En desarrollo: Node 20+ y herramientas de compilación nativa para el módulo `usb`
  (Python con `setuptools`, Xcode CLT en macOS, build-essential/libusb en Linux, VS Build Tools en Windows)

## Capacidades

| Canal | Discovery | Impresión |
|-------|-----------|-----------|
| Red Ethernet/WiFi | Scan LAN puerto **9100** + alta manual | TCP raw |
| USB | Dispositivos ESC/POS conocidos | Bulk USB |
| Bluetooth | Solo dispositivos **ya emparejados** | Best-effort (COM / RFCOMM / cu.*) |

Puedes guardar **varias impresoras**. Los jobs se enrutan por `printerId` del backend (sincronizado en el heartbeat).

### Formatos de dirección

- Red: `192.168.1.50:9100`
- USB: `usb:04b8:0e15` (VID:PID hex)
- Bluetooth: `bt:AA:BB:CC:DD:EE:FF`

## Desarrollo

```bash
cd NEGOCENDA_PrintAgent
npm install
npm run rebuild   # fuerza C++17; necesario para imprimir por USB nativo
npm run start
```

`postinstall` intenta recompilar `usb` para Electron. Si falla, el agente sigue funcionando (discovery USB por comandos del SO + impresión por red). Para impresión USB nativa hace falta un rebuild exitoso.

## Build instaladores

```bash
npm run dist:win    # .exe (NSIS)
npm run dist:mac    # .dmg
npm run dist:linux  # AppImage
```

Los artefactos quedan en `release/`.

Copia los instaladores a `NEGOCENDA_Front/public/downloads/print-agent/` (o `npm run publish:downloads`) para que los botones del modal funcionen:

- `Negocenda-Print-Agent-Setup.exe`
- `Negocenda-Print-Agent.dmg`
- `Negocenda-Print-Agent.AppImage`

## Uso en la PC del local

1. Instala y abre **Negocenda Print Agent**.
2. Pon la URL del API (ej. `http://localhost:3000` o tu dominio de producción).
3. En la web (owner): Empresas → settings → **Generar código**.
4. Pega el código en el helper → **Emparejar**.
5. Pulsa **Buscar** para detectar impresoras (red / USB / Bluetooth emparejado), o agrégalas en **Manual**.
6. Configura ancho 58/80 mm; usa **Probar** en cada tarjeta.
7. Pulsa **Iniciar**. Deja el icono en la bandeja.
8. En el modal web: asigna rutas Recibo/Comanda y prueba.

### macOS (Gatekeeper + permisos)

La app se distribuye **sin** Apple Developer ID / notarización. Tras instalar desde el `.dmg`:

1. Arrastra la app a **Aplicaciones**.
2. Primera vez: **clic derecho → Abrir** (no solo doble clic), **o** en Terminal:

```bash
xattr -cr "/Applications/Negocenda Print Agent.app"
open "/Applications/Negocenda Print Agent.app"
```

macOS puede pedir permiso de **red local** y **Bluetooth**.

### Bluetooth (límites)

La impresión BT es best-effort:

- **Windows**: necesita puerto COM/SPP asociado al dispositivo.
- **Linux**: necesita `/dev/rfcomm*` (p.ej. `rfcomm bind`).
- **macOS**: necesita un dispositivo `cu.*` serial expuesto por el sistema; si no hay canal serial, usa red o USB.

## Notas

- El helper se autentica con `agentToken` (no necesita sesión web abierta).
- Poll de jobs cada ~25s + heartbeat cada ~20s.
- Flutter sigue siendo opcional para tablets.
