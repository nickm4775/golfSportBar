import {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  ipcMain,
  shell,
} from 'electron';
import path from 'path';
import { agentRuntime } from './agent-runtime';
import { store, LocalPrinter } from './store';
import { discoverPrinters, DiscoveredPrinter } from './printer-discovery';

let tray: Tray | null = null;
let mainWindow: BrowserWindow | null = null;
let isQuitting = false;
const logs: string[] = [];
let discoverSignal = { cancelled: false };

function iconPath() {
  return path.join(__dirname, '..', 'assets', 'trayTemplate.png');
}

function createTrayIcon() {
  try {
    const image = nativeImage.createFromPath(iconPath());
    if (!image.isEmpty()) {
      const sized = image.resize({ width: 16, height: 16 });
      if (process.platform === 'darwin') {
        sized.setTemplateImage(true);
      }
      return sized;
    }
  } catch {
    // fallback
  }
  return nativeImage.createEmpty();
}

function pushLog(line: string) {
  logs.unshift(line);
  if (logs.length > 80) logs.pop();
  mainWindow?.webContents.send('agent:log', line);
}

function broadcastStatus() {
  const status = agentRuntime.getStatus();
  mainWindow?.webContents.send('agent:status', status);
  updateTrayMenu();
}

function createWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 640,
    height: 800,
    minWidth: 520,
    minHeight: 640,
    show: true,
    title: 'Negocenda Print Agent',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function updateTrayMenu() {
  if (!tray) return;
  const status = agentRuntime.getStatus();
  const menu = Menu.buildFromTemplate([
    { label: status.message, enabled: false },
    { type: 'separator' },
    {
      label: 'Abrir configuración',
      click: () => createWindow(),
    },
    {
      label: status.running ? 'Detener agente' : 'Iniciar agente',
      enabled: status.paired,
      click: async () => {
        try {
          if (status.running) agentRuntime.stop();
          else await agentRuntime.start();
          broadcastStatus();
        } catch (error) {
          pushLog(`Error: ${(error as Error).message}`);
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        agentRuntime.stop();
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(`Negocenda Print — ${status.message}`);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Negocenda Print Agent');
  tray.on('double-click', () => createWindow());
  updateTrayMenu();
}

function registerIpc() {
  ipcMain.handle('agent:getState', () => ({
    apiBaseUrl: store.get('apiBaseUrl'),
    status: agentRuntime.getStatus(),
    printers: agentRuntime.getPrinters(),
    logs: [...logs],
    businessId: store.get('businessId'),
    agentId: store.get('agentId'),
  }));

  ipcMain.handle('agent:setApiBaseUrl', (_e, url: string) => {
    store.set('apiBaseUrl', String(url || '').replace(/\/$/, ''));
    return store.get('apiBaseUrl');
  });

  ipcMain.handle('agent:pair', async (_e, code: string, apiBaseUrl?: string) => {
    const result = await agentRuntime.pair(code, apiBaseUrl);
    broadcastStatus();
    return result;
  });

  ipcMain.handle('agent:start', async () => {
    await agentRuntime.start();
    broadcastStatus();
    return agentRuntime.getStatus();
  });

  ipcMain.handle('agent:stop', () => {
    agentRuntime.stop();
    broadcastStatus();
    return agentRuntime.getStatus();
  });

  ipcMain.handle('agent:unpair', () => {
    agentRuntime.unpair();
    broadcastStatus();
    return agentRuntime.getStatus();
  });

  ipcMain.handle('agent:savePrinter', (_e, printer: LocalPrinter) => {
    return agentRuntime.savePrinter(printer);
  });

  ipcMain.handle(
    'agent:updatePrinter',
    (_e, address: string, patch: Partial<LocalPrinter>) => {
      return agentRuntime.updatePrinter(address, patch);
    },
  );

  ipcMain.handle('agent:removePrinter', (_e, address: string) => {
    return agentRuntime.removePrinter(address);
  });

  ipcMain.handle('agent:testPrint', async (_e, address: string) => {
    await agentRuntime.testPrint(address);
    return { ok: true };
  });

  ipcMain.handle(
    'agent:discoverPrinters',
    async (
      _e,
      opts?: { network?: boolean; usb?: boolean; bluetooth?: boolean },
    ): Promise<DiscoveredPrinter[]> => {
      discoverSignal = { cancelled: false };
      return discoverPrinters({
        network: opts?.network ?? true,
        usb: opts?.usb ?? true,
        bluetooth: opts?.bluetooth ?? true,
        signal: discoverSignal,
        onProgress: (message) => {
          pushLog(message);
          mainWindow?.webContents.send('agent:discoverProgress', message);
        },
      });
    },
  );

  ipcMain.handle('agent:cancelDiscover', () => {
    discoverSignal.cancelled = true;
    return { ok: true };
  });

  ipcMain.handle('shell:openExternal', (_e, url: string) => shell.openExternal(url));
}

app.whenReady().then(() => {
  agentRuntime.setHandlers({
    onLog: pushLog,
    onStatus: () => broadcastStatus(),
  });
  agentRuntime.ensureDeviceId();
  registerIpc();
  createTray();
  createWindow();

  if (store.get('autoLaunch')) {
    app.setLoginItemSettings({ openAtLogin: true, openAsHidden: true });
  }

  if (store.get('agentId') && store.get('agentToken')) {
    agentRuntime
      .start()
      .then(broadcastStatus)
      .catch((error) => {
        pushLog(`Auto-start falló: ${(error as Error).message}`);
      });
  }
});

app.on('window-all-closed', () => {
  // Keep tray process alive when windows are hidden.
});

app.on('before-quit', () => {
  isQuitting = true;
  agentRuntime.stop();
});
