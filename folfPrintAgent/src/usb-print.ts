import fs from 'fs';
import { parseUsbAddress, type ParsedUsbAddress } from './printer-address';

type UsbModule = typeof import('usb');
type UsbDevice = import('usb').Device;

function loadUsb(): UsbModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('usb') as UsbModule;
  } catch {
    return null;
  }
}

function findBulkOutEndpoint(device: UsbDevice): import('usb').OutEndpoint {
  const ifaceCount = device.interfaces?.length ?? 0;
  for (let i = 0; i < ifaceCount; i++) {
    const iface = device.interface(i);
    try {
      if (iface.isKernelDriverActive()) {
        try {
          iface.detachKernelDriver();
        } catch {
          // macOS / Windows may not allow detach; continue trying claim
        }
      }
    } catch {
      // isKernelDriverActive unsupported on some platforms
    }

    try {
      iface.claim();
    } catch (error) {
      throw new Error(
        `No se pudo reclamar la interfaz USB (${(error as Error).message}). ¿Ocupada por el sistema?`,
      );
    }

    for (const endpoint of iface.endpoints) {
      if (endpoint.direction === 'out' && endpoint.transferType === 2 /* BULK */) {
        return endpoint as import('usb').OutEndpoint;
      }
    }

    try {
      iface.release(true);
    } catch {
      // ignore
    }
  }
  throw new Error('No se encontró endpoint BULK OUT en el dispositivo USB');
}

async function printUsbViaLp(data: Buffer, timeoutMs: number): Promise<void> {
  for (let i = 0; i < 8; i++) {
    const devicePath = `/dev/usb/lp${i}`;
    try {
      await fs.promises.access(devicePath, fs.constants.W_OK);
    } catch {
      continue;
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout escribiendo ${devicePath}`)),
        timeoutMs,
      );
      fs.open(devicePath, 'w', (openErr, fd) => {
        if (openErr) {
          clearTimeout(timer);
          return reject(openErr);
        }
        fs.write(fd, data, 0, data.length, null, (writeErr) => {
          fs.close(fd, () => {
            clearTimeout(timer);
            if (writeErr) reject(writeErr);
            else resolve();
          });
        });
      });
    });
    return;
  }
  throw new Error('No hay /dev/usb/lp* disponible');
}

function readSerial(device: UsbDevice): Promise<string | null> {
  const index = device.deviceDescriptor.iSerialNumber;
  if (!index) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      device.getStringDescriptor(index, (err, result) => {
        if (err || !result) resolve(null);
        else resolve(String(result));
      });
    } catch {
      resolve(null);
    }
  });
}

async function findUsbDevice(usb: UsbModule, parsed: ParsedUsbAddress): Promise<UsbDevice> {
  const candidates = usb
    .getDeviceList()
    .filter(
      (d) =>
        d.deviceDescriptor.idVendor === parsed.vendorId &&
        d.deviceDescriptor.idProduct === parsed.productId,
    );

  if (!candidates.length) {
    throw new Error(
      `Impresora USB no encontrada (usb:${parsed.vendorId.toString(16)}:${parsed.productId.toString(16)}). ¿Conectada?`,
    );
  }

  if (parsed.busNumber != null && parsed.deviceAddress != null) {
    const byBus = candidates.find(
      (d) => d.busNumber === parsed.busNumber && d.deviceAddress === parsed.deviceAddress,
    );
    if (byBus) return byBus;
    throw new Error(
      `Impresora USB no encontrada en bus ${parsed.busNumber}.${parsed.deviceAddress}. ¿Se reubicó el puerto? Vuelve a Buscar.`,
    );
  }

  if (parsed.serial) {
    const target = parsed.serial.toLowerCase();
    for (const device of candidates) {
      let opened = false;
      try {
        device.open();
        opened = true;
        const serial = await readSerial(device);
        if (serial && serial.replace(/[^0-9A-Za-z._-]/g, '_').toLowerCase() === target) {
          return device;
        }
      } catch {
        // try next
      } finally {
        if (opened) {
          try {
            device.close();
          } catch {
            // ignore
          }
        }
      }
    }
    throw new Error(`Impresora USB con serial ${parsed.serial} no encontrada. ¿Conectada?`);
  }

  return usb.findByIds(parsed.vendorId, parsed.productId) ?? candidates[0];
}

async function printUsbNative(
  usb: UsbModule,
  address: string,
  data: Buffer,
  timeoutMs: number,
): Promise<void> {
  const parsed = parseUsbAddress(address);
  const device = await findUsbDevice(usb, parsed);

  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      try {
        device.close();
      } catch {
        // ignore
      }
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(() => done(new Error(`Timeout imprimiendo USB ${address}`)), timeoutMs);

    try {
      device.open();
      const endpoint = findBulkOutEndpoint(device);
      endpoint.transfer(data, (err) => {
        clearTimeout(timer);
        if (err) return done(err);
        done();
      });
    } catch (error) {
      clearTimeout(timer);
      done(error as Error);
    }
  });
}

export async function printUsb(
  address: string,
  data: Buffer,
  timeoutMs = 10000,
): Promise<void> {
  const usb = loadUsb();
  if (usb) {
    await printUsbNative(usb, address, data, timeoutMs);
    return;
  }

  if (process.platform === 'linux') {
    await printUsbViaLp(data, timeoutMs);
    return;
  }

  throw new Error(
    `Módulo USB no disponible. Ejecuta npm run rebuild (requiere herramientas nativas / setuptools). Dirección: ${address}`,
  );
}
