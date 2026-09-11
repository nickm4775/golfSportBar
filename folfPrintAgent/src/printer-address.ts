export type ParsedUsbAddress = {
  vendorId: number;
  productId: number;
  /** Present when address includes :SERIAL */
  serial?: string;
  /** Present when address includes #bus.deviceAddress */
  busNumber?: number;
  deviceAddress?: number;
};

/**
 * Formats:
 * - usb:VID:PID (legacy)
 * - usb:VID:PID:SERIAL
 * - usb:VID:PID#bus.dev
 * - usb:VID:PID:SERIAL#bus.dev (preferred: clones often share serial)
 */
export function parseUsbAddress(address: string): ParsedUsbAddress {
  const raw = address.trim();

  // usb:vid:pid:serial#bus.dev  OR  usb:vid:pid#bus.dev
  const withBus =
    /^usb:([0-9a-fA-F]{1,4}):([0-9a-fA-F]{1,4})(?::([^#\s]+))?#(\d+)\.(\d+)$/i.exec(raw);
  if (withBus) {
    return {
      vendorId: parseInt(withBus[1], 16),
      productId: parseInt(withBus[2], 16),
      serial: withBus[3] || undefined,
      busNumber: parseInt(withBus[4], 10),
      deviceAddress: parseInt(withBus[5], 10),
    };
  }

  const withSerial = /^usb:([0-9a-fA-F]{1,4}):([0-9a-fA-F]{1,4}):([^#\s]+)$/i.exec(raw);
  if (withSerial) {
    return {
      vendorId: parseInt(withSerial[1], 16),
      productId: parseInt(withSerial[2], 16),
      serial: withSerial[3],
    };
  }

  const basic = /^usb:([0-9a-fA-F]{1,4}):([0-9a-fA-F]{1,4})$/i.exec(raw);
  if (basic) {
    return {
      vendorId: parseInt(basic[1], 16),
      productId: parseInt(basic[2], 16),
    };
  }

  throw new Error(
    `Dirección USB inválida: ${address} (esperado usb:VID:PID[:SERIAL][#bus.dev])`,
  );
}

export function sanitizeUsbSerial(serial: string): string {
  return serial.trim().replace(/[^0-9A-Za-z._-]/g, '_');
}

/**
 * When bus/deviceAddress are known, always append #bus.dev so two clones
 * with the same factory serial remain distinct.
 */
export function formatUsbAddress(
  vendorId: number,
  productId: number,
  opts?: {
    serial?: string | null;
    busNumber?: number;
    deviceAddress?: number;
  },
): string {
  const base = `usb:${vendorId.toString(16).padStart(4, '0')}:${productId.toString(16).padStart(4, '0')}`;
  const serial = opts?.serial?.trim();
  const withSerial = serial ? `${base}:${sanitizeUsbSerial(serial)}` : base;
  if (opts?.busNumber != null && opts?.deviceAddress != null) {
    return `${withSerial}#${opts.busNumber}.${opts.deviceAddress}`;
  }
  return withSerial;
}

export function parseBluetoothAddress(address: string): { mac: string } {
  const raw = address.trim();
  const match = /^bt:([0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5})$/.exec(raw);
  if (!match) {
    throw new Error(`Dirección Bluetooth inválida: ${address} (esperado bt:AA:BB:CC:DD:EE:FF)`);
  }
  return { mac: match[1].toUpperCase() };
}

export function formatBluetoothAddress(mac: string): string {
  const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  if (cleaned.length !== 12) {
    throw new Error(`MAC Bluetooth inválida: ${mac}`);
  }
  const parts = cleaned.match(/.{2}/g)!;
  return `bt:${parts.join(':')}`;
}

export function normalizeNetworkAddress(address: string): string {
  const trimmed = address.trim();
  if (!trimmed) throw new Error('Dirección de red vacía');
  if (!trimmed.includes(':')) return `${trimmed}:9100`;
  return trimmed;
}
