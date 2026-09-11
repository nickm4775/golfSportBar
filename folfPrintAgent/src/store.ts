import Store from 'electron-store';

export type PrinterConnectionType = 'network' | 'usb' | 'bluetooth';

export type LocalPrinter = {
  /** Backend UUID, filled after heartbeat sync */
  id?: string;
  name: string;
  connectionType: PrinterConnectionType;
  /** network: IP:9100 | usb:VID:PID | bt:MAC */
  address: string;
  paperWidth: number;
  isOnline: boolean;
  lastSeenAt?: string;
  displayName?: string;
};

export type AgentStoreSchema = {
  apiBaseUrl: string;
  agentId: string | null;
  agentToken: string | null;
  businessId: string | null;
  deviceId: string;
  printers: LocalPrinter[];
  autoLaunch: boolean;
};

// electron-store is CJS; construct with any to satisfy typings across versions
const StoreCtor = Store as unknown as new (options?: {
  name?: string;
  defaults?: AgentStoreSchema;
}) => {
  get: <K extends keyof AgentStoreSchema>(key: K) => AgentStoreSchema[K];
  set: <K extends keyof AgentStoreSchema>(key: K, value: AgentStoreSchema[K]) => void;
};

export const store = new StoreCtor({
  name: 'negocenda-print-agent',
  defaults: {
    apiBaseUrl: 'http://localhost:3000',
    agentId: null,
    agentToken: null,
    businessId: null,
    deviceId: '',
    printers: [],
    autoLaunch: true,
  },
});
