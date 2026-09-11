import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { parseBluetoothAddress } from './printer-address';

const execFileAsync = promisify(execFile);

function writeRawDevice(devicePath: string, data: Buffer, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    };

    const timer = setTimeout(
      () => done(new Error(`Timeout escribiendo ${devicePath}`)),
      timeoutMs,
    );

    fs.open(devicePath, 'w', (openErr, fd) => {
      if (openErr) return done(openErr);
      fs.write(fd, data, 0, data.length, null, (writeErr) => {
        fs.close(fd, () => {
          if (writeErr) done(writeErr);
          else done();
        });
      });
    });
  });
}

async function findWindowsComPort(mac: string): Promise<string | null> {
  const normalized = mac.replace(/:/g, '').toUpperCase();
  const script = `
$mac = '${normalized}'
$ports = @()
Get-PnpDevice -Class Ports -Status OK -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_.FriendlyName -match 'COM(\\d+)') {
    $ports += [PSCustomObject]@{ Com = "COM$($Matches[1])"; Id = $_.InstanceId; Name = $_.FriendlyName }
  }
}
$hit = $ports | Where-Object { $_.Id.ToUpper().Contains($mac) } | Select-Object -First 1
if (-not $hit) { $hit = $ports | Where-Object { $_.Name -match 'Bluetooth|SPP|Standard Serial' } | Select-Object -First 1 }
if ($hit) { $hit.Com }
`;
  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-Command', script],
      { timeout: 8000, windowsHide: true },
    );
    const com = stdout.trim();
    return com || null;
  } catch {
    return null;
  }
}

async function findLinuxRfcomm(): Promise<string | null> {
  for (let i = 0; i < 8; i++) {
    const devicePath = `/dev/rfcomm${i}`;
    try {
      await fs.promises.access(devicePath, fs.constants.R_OK | fs.constants.W_OK);
      return devicePath;
    } catch {
      // try next
    }
  }
  return null;
}

async function findMacCuPort(mac: string): Promise<string | null> {
  const compact = mac.replace(/:/g, '').toLowerCase();
  try {
    const dir = '/dev';
    const entries = await fs.promises.readdir(dir);
    const candidates = entries
      .filter((name) => name.startsWith('cu.'))
      .filter((name) => {
        const lower = name.toLowerCase();
        return (
          lower.includes('bluetooth') ||
          lower.includes('rfcomm') ||
          lower.includes(compact) ||
          lower.includes('serial')
        );
      })
      .map((name) => path.join(dir, name));
    return candidates[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Best-effort Bluetooth ESC/POS print for already-paired devices.
 * Uses OS serial/RFCOMM character devices when available.
 */
export async function printBluetooth(
  address: string,
  data: Buffer,
  timeoutMs = 12000,
): Promise<void> {
  const { mac } = parseBluetoothAddress(address);

  if (process.platform === 'win32') {
    const com = await findWindowsComPort(mac);
    if (!com) {
      throw new Error(
        `Bluetooth emparejado (${mac}) sin puerto COM serial. Configura el puerto SPP en Windows.`,
      );
    }
    await writeRawDevice(`\\\\.\\${com}`, data, timeoutMs);
    return;
  }

  if (process.platform === 'linux') {
    const devicePath = await findLinuxRfcomm();
    if (!devicePath) {
      throw new Error(
        `Bluetooth emparejado (${mac}) sin /dev/rfcomm*. Enlaza RFCOMM (p.ej. rfcomm bind) e inténtalo de nuevo.`,
      );
    }
    await writeRawDevice(devicePath, data, timeoutMs);
    return;
  }

  if (process.platform === 'darwin') {
    const devicePath = await findMacCuPort(mac);
    if (!devicePath) {
      throw new Error(
        'Bluetooth emparejado pero sin canal serial disponible en macOS. Usa red o USB si es posible.',
      );
    }
    await writeRawDevice(devicePath, data, timeoutMs);
    return;
  }

  throw new Error(`Impresión Bluetooth no soportada en plataforma ${process.platform}`);
}
