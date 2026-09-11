import net from 'net';

export function parseAddress(address: string): { host: string; port: number } {
  const parts = address.split(':');
  const host = parts[0]?.trim() || '127.0.0.1';
  const port = parts.length > 1 ? Number(parts[1]) || 9100 : 9100;
  return { host, port };
}

export function printRawTcp(
  address: string,
  data: Buffer,
  timeoutMs = 8000,
): Promise<void> {
  const { host, port } = parseAddress(address);
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err);
      else resolve();
    };

    socket.setTimeout(timeoutMs);
    socket.once('timeout', () => done(new Error(`Timeout conectando a ${host}:${port}`)));
    socket.once('error', (err) => done(err));
    socket.connect(port, host, () => {
      socket.write(data, (err) => {
        if (err) return done(err);
        socket.end(() => done());
      });
    });
  });
}
