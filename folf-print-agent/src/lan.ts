import * as net from 'node:net';
import * as os from 'node:os';

export type DiscoveredPrinter = {
  host: string;
  port: number;
  latencyMs: number;
};

export type ProbeResult = {
  online: boolean;
  latencyMs?: number;
  error?: string;
};

const DEFAULT_PORT = 9100;

export function detectLocalCidrs(): string[] {
  const cidrs = new Set<string>();
  const ifaces = os.networkInterfaces();
  for (const entries of Object.values(ifaces)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      const parts = entry.address.split('.').map(Number);
      if (parts.length !== 4) continue;
      cidrs.add(`${parts[0]}.${parts[1]}.${parts[2]}.0/24`);
    }
  }
  if (cidrs.size === 0) cidrs.add('192.168.1.0/24');
  return [...cidrs];
}

function hostsFromCidr(cidr: string): string[] {
  const [base, bitsRaw] = cidr.split('/');
  const bits = Number(bitsRaw ?? 24);
  const parts = (base ?? '192.168.1.0').split('.').map(Number);
  if (bits !== 24 || parts.length !== 4) {
    return Array.from(
      { length: 254 },
      (_, i) => `${parts[0] ?? 192}.${parts[1] ?? 168}.${parts[2] ?? 1}.${i + 1}`,
    );
  }
  return Array.from({ length: 254 }, (_, i) => `${parts[0]}.${parts[1]}.${parts[2]}.${i + 1}`);
}

export function probeTcp(
  host: string,
  port = DEFAULT_PORT,
  timeoutMs = 2500,
): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (result: ProbeResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      finish({ online: true, latencyMs: Date.now() - started });
    });
    socket.once('timeout', () => {
      finish({ online: false, error: 'timeout' });
    });
    socket.once('error', (error) => {
      finish({ online: false, error: error.message });
    });
    socket.connect(port, host);
  });
}

export async function scanLanForPrinters(options?: {
  cidr?: string;
  port?: number;
  timeoutMs?: number;
  concurrency?: number;
}): Promise<DiscoveredPrinter[]> {
  const port = options?.port ?? DEFAULT_PORT;
  const timeoutMs = options?.timeoutMs ?? 400;
  const concurrency = options?.concurrency ?? 64;
  const cidrs = options?.cidr ? [options.cidr] : detectLocalCidrs();
  const hosts = [...new Set(cidrs.flatMap(hostsFromCidr))];
  const found: DiscoveredPrinter[] = [];

  for (let i = 0; i < hosts.length; i += concurrency) {
    const batch = hosts.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (host) => {
        const result = await probeTcp(host, port, timeoutMs);
        if (!result.online) return null;
        return { host, port, latencyMs: result.latencyMs ?? 0 };
      }),
    );
    for (const item of results) {
      if (item) found.push(item);
    }
  }

  return found.sort((a, b) => a.latencyMs - b.latencyMs);
}

export async function sendTcpBytes(
  host: string,
  port: number,
  data: Buffer,
  timeoutMs = 5000,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.write(data, (writeError) => {
        if (writeError) {
          finish(writeError);
          return;
        }
        socket.end(() => finish());
      });
    });
    socket.once('timeout', () => finish(new Error('Print timeout')));
    socket.once('error', (error) => finish(error));
    socket.connect(port, host);
  });
}
