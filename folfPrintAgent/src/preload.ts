import { contextBridge, ipcRenderer } from 'electron';

type ConnectionType = 'network' | 'usb' | 'bluetooth';

type LocalPrinter = {
  id?: string;
  name: string;
  connectionType: ConnectionType;
  address: string;
  paperWidth: number;
  isOnline: boolean;
  lastSeenAt?: string;
  displayName?: string;
};

contextBridge.exposeInMainWorld('printAgent', {
  getState: () => ipcRenderer.invoke('agent:getState'),
  setApiBaseUrl: (url: string) => ipcRenderer.invoke('agent:setApiBaseUrl', url),
  pair: (code: string, apiBaseUrl?: string) =>
    ipcRenderer.invoke('agent:pair', code, apiBaseUrl),
  start: () => ipcRenderer.invoke('agent:start'),
  stop: () => ipcRenderer.invoke('agent:stop'),
  unpair: () => ipcRenderer.invoke('agent:unpair'),
  savePrinter: (printer: LocalPrinter) => ipcRenderer.invoke('agent:savePrinter', printer),
  updatePrinter: (address: string, patch: Partial<LocalPrinter>) =>
    ipcRenderer.invoke('agent:updatePrinter', address, patch),
  removePrinter: (address: string) => ipcRenderer.invoke('agent:removePrinter', address),
  testPrint: (address: string) => ipcRenderer.invoke('agent:testPrint', address),
  discoverPrinters: (opts?: { network?: boolean; usb?: boolean; bluetooth?: boolean }) =>
    ipcRenderer.invoke('agent:discoverPrinters', opts),
  cancelDiscover: () => ipcRenderer.invoke('agent:cancelDiscover'),
  onLog: (cb: (line: string) => void) => {
    const listener = (_: unknown, line: string) => cb(line);
    ipcRenderer.on('agent:log', listener);
    return () => ipcRenderer.removeListener('agent:log', listener);
  },
  onStatus: (cb: (status: unknown) => void) => {
    const listener = (_: unknown, status: unknown) => cb(status);
    ipcRenderer.on('agent:status', listener);
    return () => ipcRenderer.removeListener('agent:status', listener);
  },
  onDiscoverProgress: (cb: (message: string) => void) => {
    const listener = (_: unknown, message: string) => cb(message);
    ipcRenderer.on('agent:discoverProgress', listener);
    return () => ipcRenderer.removeListener('agent:discoverProgress', listener);
  },
});
