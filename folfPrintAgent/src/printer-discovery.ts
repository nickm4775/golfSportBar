import net from 'net';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { PrinterConnectionType } from './store';
import { formatBluetoothAddress, formatUsbAddress } from './printer-address';

const execFileAsync = promisify(execFile);

export type DiscoveredPrinter = {
  connectionType: PrinterConnectionType;
  address: string;
  name: string;
  isReachable: boolean;
  printCapable?: 'unknown' | 'likely';
  note?: string;
};

export type DiscoverOptions = {
  network?: boolean;
  usb?: boolean;
  bluetooth?: boolean;
  onProgress?: (message: string) => void;
  signal?: { cancelled: boolean };
};

/** Common ESC/POS thermal printer USB vendor IDs */
const THERMAL_USB_VENDORS: Record<number, string> = {
  0x04b8: 'Epson',
  0x0519: 'Star Micronics',
  0x1d90: 'Citizen',
  0x1504: 'Bixolon',
  0x0fe6: 'ICS Advent / POS',
  0x0483: 'STMicro / clones',
  0x0416: 'Winbond / Xprinter',
  0x1fc9: 'NXP / Rongta',
  0x28e9: 'Gprinter / Gainscha',
  0x6868: 'Xprinter',
  0x20d1: 'Rongta',
  0x0dd4: 'Custom Engineering',
  0x154f: 'SNBC',
  0x0525: 'Netchip / POS',
  0x1a86: 'QinHeng / CH340 adapters',
};

const PRINTER_NAME_HINT =
  /print|impresor|thermal|pos|ticket|receipt|epson|star|xprinter|rongta|bixolon|citizen|zebra/i;

function isCancelled(signal?: { cancelled: boolean }) {
  return Boolean(signal?.cancelled);
}

function ipv4LocalSubnets(): Array<{ base: string; prefix: number }> {
  const ifaces = os.networkInterfaces();
  const result: Array<{ base: string; prefix: number }> = [];
  for (const entries of Object.values(ifaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      if (entry.address.startsWith('169.254.')) continue;
      const parts = entry.address.split('.').map(Number);
      const maskParts = (entry.netmask ?? '255.255.255.0').split('.').map(Number);
      const prefix = maskParts.reduce(
        (acc, octet) => acc + octet.toString(2).replace(/0/g, '').length,
        0,
      );
      // Cap scan to /24 for safety/speed even on wider nets
      const scanPrefix = Math.max(prefix, 24);
      const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
      if (!result.some((r) => r.base === base)) {
        result.push({ base, prefix: scanPrefix });
      }
    }
  }
  return result;
}

function probeTcp(host: string, port: number, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R | null>,
  signal?: { cancelled: boolean },
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      if (isCancelled(signal)) return;
      const current = index++;
      const value = await fn(items[current]);
      if (value) results.push(value);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function discoverNetwork(
  onProgress?: (message: string) => void,
  signal?: { cancelled: boolean },
): Promise<DiscoveredPrinter[]> {
  const subnets = ipv4LocalSubnets();
  if (!subnets.length) {
    onProgress?.('No hay interfaces IPv4 locales para escanear');
    return [];
  }

  const hosts: string[] = [];
  for (const subnet of subnets) {
    for (let i = 1; i <= 254; i++) {
      hosts.push(`${subnet.base}.${i}`);
    }
  }
  onProgress?.(`Escaneando ${hosts.length} hosts en puerto 9100…`);

  const found = await mapPool(
    hosts,
    48,
    async (host) => {
      if (isCancelled(signal)) return null;
      const ok = await probeTcp(host, 9100, 400);
      if (!ok) return null;
      return {
        connectionType: 'network' as const,
        address: `${host}:9100`,
        name: `Red ${host}`,
        isReachable: true,
        printCapable: 'likely' as const,
      };
    },
    signal,
  );

  onProgress?.(`Red: ${found.length} impresora(s) en :9100`);
  return found;
}

async function discoverUsbViaNative(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[] | null> {
  let usb: typeof import('usb');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    usb = require('usb');
  } catch (error) {
    onProgress?.(`Módulo usb nativo no cargó: ${(error as Error).message}`);
    return null;
  }

  const devices = usb.getDeviceList();
  const results: DiscoveredPrinter[] = [];

  for (const device of devices) {
    const vid = device.deviceDescriptor.idVendor;
    const pid = device.deviceDescriptor.idProduct;
    const vendorName = THERMAL_USB_VENDORS[vid];
    const isPrinterClass = (() => {
      try {
        return device.deviceDescriptor.bDeviceClass === 7;
      } catch {
        return false;
      }
    })();

    if (!vendorName && !isPrinterClass) continue;

    let serial: string | null = null;
    let name = vendorName
      ? `${vendorName} USB (${pid.toString(16)})`
      : `USB impresora ${vid.toString(16)}:${pid.toString(16)}`;
    let note: string | undefined;

    try {
      device.open();
      try {
        const manufacturer = await readUsbString(device, device.deviceDescriptor.iManufacturer);
        const product = await readUsbString(device, device.deviceDescriptor.iProduct);
        serial = await readUsbString(device, device.deviceDescriptor.iSerialNumber);
        const label = [manufacturer, product].filter(Boolean).join(' ').trim();
        if (label) name = label;
        if (serial) name = `${name} · ${serial}`;
      } finally {
        device.close();
      }
    } catch (error) {
      note = `Detectada; puede estar ocupada por el sistema (${(error as Error).message})`;
    }

    const address = formatUsbAddress(vid, pid, {
      serial,
      busNumber: device.busNumber,
      deviceAddress: device.deviceAddress,
    });
    // Same model/serial clones: distinguish in the list by USB port
    name = `${name} · puerto ${device.busNumber}.${device.deviceAddress}`;

    results.push({
      connectionType: 'usb',
      address,
      name,
      isReachable: !note,
      printCapable: 'likely',
      note,
    });
  }

  return results;
}

function parseVidPidPairs(text: string): Array<{ vid: number; pid: number; name: string }> {
  const results: Array<{ vid: number; pid: number; name: string }> = [];
  const re =
    /(?:Vendor ID|idVendor|VID)[^\n0-9a-fA-F]*([0-9a-fA-F]{3,4}).*?(?:Product ID|idProduct|PID)[^\n0-9a-fA-F]*([0-9a-fA-F]{3,4})/gis;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const vid = parseInt(match[1], 16);
    const pid = parseInt(match[2], 16);
    results.push({
      vid,
      pid,
      name: THERMAL_USB_VENDORS[vid]
        ? `${THERMAL_USB_VENDORS[vid]} USB`
        : `USB ${vid.toString(16)}:${pid.toString(16)}`,
    });
  }

  // lsusb style: Bus 001 Device 002: ID 04b8:0e15 Epson...
  for (const line of text.split('\n')) {
    const m = /ID\s+([0-9a-fA-F]{4}):([0-9a-fA-F]{4})\s*(.*)$/i.exec(line);
    if (!m) continue;
    const vid = parseInt(m[1], 16);
    const pid = parseInt(m[2], 16);
    results.push({
      vid,
      pid,
      name: (m[3] || THERMAL_USB_VENDORS[vid] || 'USB').trim(),
    });
  }

  return results;
}

async function discoverUsbViaOs(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[]> {
  onProgress?.('Buscando USB vía sistema…');
  try {
    let stdout = '';
    if (process.platform === 'darwin') {
      ({ stdout } = await execFileAsync('system_profiler', ['SPUSBDataType'], {
        timeout: 15000,
        maxBuffer: 8 * 1024 * 1024,
      }));
    } else if (process.platform === 'linux') {
      ({ stdout } = await execFileAsync('lsusb', [], { timeout: 8000 }));
    } else if (process.platform === 'win32') {
      const script = `
Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue |
  Where-Object { $_.InstanceId -match 'USB\\\\VID_([0-9A-F]{4})&PID_([0-9A-F]{4})' } |
  ForEach-Object {
    $m = [regex]::Match($_.InstanceId, 'VID_([0-9A-F]{4})&PID_([0-9A-F]{4})')
    "ID $($m.Groups[1].Value):$($m.Groups[2].Value) $($_.FriendlyName)"
  }
`;
      ({ stdout } = await execFileAsync(
        'powershell.exe',
        ['-NoProfile', '-Command', script],
        { timeout: 12000, windowsHide: true },
      ));
    } else {
      return [];
    }

    const pairs = parseVidPidPairs(stdout);
    const seen = new Set<string>();
    const results: DiscoveredPrinter[] = [];
    let collapsed = 0;
    for (const pair of pairs) {
      const vendorKnown = Boolean(THERMAL_USB_VENDORS[pair.vid]);
      const nameLikely = PRINTER_NAME_HINT.test(pair.name);
      if (!vendorKnown && !nameLikely) continue;
      const address = formatUsbAddress(pair.vid, pair.pid);
      if (seen.has(address)) {
        collapsed += 1;
        continue;
      }
      seen.add(address);
      results.push({
        connectionType: 'usb',
        address,
        name: pair.name || `USB ${address}`,
        isReachable: true,
        printCapable: 'likely',
      });
    }
    if (collapsed > 0) {
      onProgress?.(
        `USB sistema: ${collapsed} dispositivo(s) con la misma VID:PID omitidos; usa el módulo nativo (npm run rebuild) para distinguirlos`,
      );
    }
    return results;
  } catch (error) {
    onProgress?.(`USB sistema: ${(error as Error).message}`);
    return [];
  }
}

async function discoverUsb(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[]> {
  onProgress?.('Buscando impresoras USB…');
  const native = await discoverUsbViaNative(onProgress);
  if (native && native.length) {
    onProgress?.(`USB: ${native.length} dispositivo(s)`);
    return native;
  }
  const viaOs = await discoverUsbViaOs(onProgress);
  onProgress?.(`USB: ${viaOs.length} dispositivo(s)`);
  return viaOs;
}

function readUsbString(
  device: import('usb').Device,
  index: number,
): Promise<string | null> {
  if (!index) return Promise.resolve(null);
  return new Promise((resolve) => {
    device.getStringDescriptor(index, (err, value) => {
      if (err || !value) resolve(null);
      else resolve(String(value));
    });
  });
}

function likelyPrinterName(name: string): 'likely' | 'unknown' {
  return PRINTER_NAME_HINT.test(name) ? 'likely' : 'unknown';
}

async function discoverBluetoothWindows(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[]> {
  onProgress?.('Listando Bluetooth emparejados (Windows)…');
  const script = `
Get-PnpDevice -Class Bluetooth -Status OK -ErrorAction SilentlyContinue |
  Where-Object { $_.FriendlyName -and $_.InstanceId -match 'DEV_([0-9A-F]{12})' } |
  ForEach-Object {
    $m = [regex]::Match($_.InstanceId, 'DEV_([0-9A-F]{12})')
    $mac = $m.Groups[1].Value
    $fmt = ($mac -replace '(.{2})(?!$)', '$1:').ToUpper()
    [PSCustomObject]@{ Name = $_.FriendlyName; Mac = $fmt }
  } | ConvertTo-Json -Compress
`;
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-Command', script],
      { timeout: 10000, windowsHide: true },
    );
    const trimmed = stdout.trim();
    if (!trimmed) return [];
    const parsed = JSON.parse(trimmed) as
      | { Name: string; Mac: string }
      | Array<{ Name: string; Mac: string }>;
    const list = Array.isArray(parsed) ? parsed : [parsed];
    return list
      .filter((row) => row.Mac && row.Name)
      .map((row) => ({
        connectionType: 'bluetooth' as const,
        address: formatBluetoothAddress(row.Mac),
        name: row.Name,
        isReachable: true,
        printCapable: likelyPrinterName(row.Name),
      }));
  } catch (error) {
    onProgress?.(`Bluetooth Windows: ${(error as Error).message}`);
    return [];
  }
}

async function discoverBluetoothMac(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[]> {
  onProgress?.('Listando Bluetooth emparejados (macOS)…');
  try {
    const { stdout } = await execFileAsync(
      'system_profiler',
      ['SPBluetoothDataType', '-json'],
      { timeout: 15000, maxBuffer: 10 * 1024 * 1024 },
    );
    const data = JSON.parse(stdout) as {
      SPBluetoothDataType?: Array<{
        device_connected?: Record<string, Array<Record<string, string>>>;
        device_not_connected?: Record<string, Array<Record<string, string>>>;
        cross_transport_devices?: Array<Record<string, unknown>>;
      }>;
    };
    const results: DiscoveredPrinter[] = [];
    const sections = data.SPBluetoothDataType ?? [];

    const pushDevice = (name: string, info: Record<string, string>) => {
      const macRaw =
        info.device_address ??
        info.address ??
        info['device_address'] ??
        Object.values(info).find((v) => /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i.test(String(v)));
      if (!macRaw) return;
      try {
        results.push({
          connectionType: 'bluetooth',
          address: formatBluetoothAddress(String(macRaw)),
          name: name || 'Bluetooth',
          isReachable: true,
          printCapable: likelyPrinterName(name),
        });
      } catch {
        // skip bad mac
      }
    };

    for (const section of sections) {
      for (const group of [section.device_connected, section.device_not_connected]) {
        if (!group) continue;
        for (const [name, arr] of Object.entries(group)) {
          for (const info of arr ?? []) {
            pushDevice(name, info as Record<string, string>);
          }
        }
      }
      // Newer macOS shapes: controller_properties / devices_list
      const anySection = section as Record<string, unknown>;
      for (const [key, value] of Object.entries(anySection)) {
        if (!/device/i.test(key) || typeof value !== 'object' || !value) continue;
        if (Array.isArray(value)) continue;
        for (const [name, info] of Object.entries(value as Record<string, unknown>)) {
          if (info && typeof info === 'object' && !Array.isArray(info)) {
            pushDevice(name, info as Record<string, string>);
          }
        }
      }
    }

    // Dedupe by address
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.address)) return false;
      seen.add(r.address);
      return true;
    });
  } catch (error) {
    onProgress?.(`Bluetooth macOS: ${(error as Error).message}`);
    return [];
  }
}

async function discoverBluetoothLinux(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[]> {
  onProgress?.('Listando Bluetooth emparejados (Linux)…');
  try {
    const { stdout } = await execFileAsync('bluetoothctl', ['devices', 'Paired'], {
      timeout: 8000,
    });
    const results: DiscoveredPrinter[] = [];
    for (const line of stdout.split('\n')) {
      const match = /^Device\s+([0-9A-Fa-f:]{17})\s+(.+)$/.exec(line.trim());
      if (!match) continue;
      results.push({
        connectionType: 'bluetooth',
        address: formatBluetoothAddress(match[1]),
        name: match[2].trim(),
        isReachable: true,
        printCapable: likelyPrinterName(match[2]),
      });
    }
    return results;
  } catch (error) {
    onProgress?.(`Bluetooth Linux: ${(error as Error).message}`);
    return [];
  }
}

async function discoverBluetooth(
  onProgress?: (message: string) => void,
): Promise<DiscoveredPrinter[]> {
  if (process.platform === 'win32') return discoverBluetoothWindows(onProgress);
  if (process.platform === 'darwin') return discoverBluetoothMac(onProgress);
  if (process.platform === 'linux') return discoverBluetoothLinux(onProgress);
  return [];
}

export async function discoverPrinters(
  options: DiscoverOptions = {},
): Promise<DiscoveredPrinter[]> {
  const {
    network = true,
    usb = true,
    bluetooth = true,
    onProgress,
    signal,
  } = options;

  const all: DiscoveredPrinter[] = [];

  if (network && !isCancelled(signal)) {
    all.push(...(await discoverNetwork(onProgress, signal)));
  }
  if (usb && !isCancelled(signal)) {
    all.push(...(await discoverUsb(onProgress)));
  }
  if (bluetooth && !isCancelled(signal)) {
    all.push(...(await discoverBluetooth(onProgress)));
  }

  onProgress?.(`Listo: ${all.length} candidata(s)`);
  return all;
}
