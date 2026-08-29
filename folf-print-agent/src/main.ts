import 'dotenv/config';
import { Centrifuge } from 'centrifuge';
import { renderEscPosTicket, type TicketPayload } from './escpos';
import { probeTcp, scanLanForPrinters, sendTcpBytes } from './lan';

type PrintSettings = {
  printExecutionMode: 'DIRECT' | 'AGENT';
  printers: Array<{
    station: 'KITCHEN' | 'BAR';
    host: string | null;
    port: number;
    enabled: boolean;
    paperWidth: number;
  }>;
};

type PrintJob = {
  id: string;
  station: 'KITCHEN' | 'BAR';
  status: string;
  payload: TicketPayload;
};

type RealtimeEvent = {
  type: string;
  requestId?: string;
  cidr?: string;
  station?: 'KITCHEN' | 'BAR';
  host?: string;
  port?: number;
  jobIds?: string[];
};

const API_URL = (process.env.API_URL ?? 'http://localhost:3000/api/v1').replace(/\/$/, '');
const EMAIL = process.env.AGENT_EMAIL ?? process.env.EMAIL ?? '';
const PASSWORD = process.env.AGENT_PASSWORD ?? process.env.PASSWORD ?? '';
const BUSINESS_ID = process.env.BUSINESS_ID ?? '';
const CENTRIFUGO_WS =
  process.env.CENTRIFUGO_WS ?? 'ws://localhost:8000/connection/websocket';
const HEARTBEAT_MS = Number(process.env.HEARTBEAT_MS ?? 45_000);

if (!EMAIL || !PASSWORD || !BUSINESS_ID) {
  console.error('Missing AGENT_EMAIL/AGENT_PASSWORD/BUSINESS_ID');
  process.exit(1);
}

let accessToken = '';
let refreshToken = '';
let settingsCache: PrintSettings | null = null;

async function api<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (init?.auth !== false && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  headers.set('x-business-id', BUSINESS_ID);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && refreshToken) {
    await refreshAccess();
    headers.set('Authorization', `Bearer ${accessToken}`);
    const retry = await fetch(`${API_URL}${path}`, { ...init, headers });
    if (!retry.ok) {
      throw new Error(`${retry.status} ${await retry.text()}`);
    }
    return (await retry.json()) as T;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function login() {
  const result = await api<{
    accessToken: string;
    refreshToken: string;
  }>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  accessToken = result.accessToken;
  refreshToken = result.refreshToken;
  console.log('Logged in');
}

async function refreshAccess() {
  const result = await api<{ accessToken: string; refreshToken?: string }>(
    '/auth/refresh',
    {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ refreshToken }),
    },
  );
  accessToken = result.accessToken;
  if (result.refreshToken) refreshToken = result.refreshToken;
}

async function realtimeToken() {
  const result = await api<{ token: string }>('/realtime/token');
  return result.token;
}

async function loadSettings() {
  settingsCache = await api<PrintSettings>(`/businesses/${BUSINESS_ID}/settings/print`);
  return settingsCache;
}

async function processPendingJobs() {
  const jobs = await api<PrintJob[]>(
    `/businesses/${BUSINESS_ID}/print-jobs?status=PENDING`,
  );
  for (const job of jobs) {
    await printJob(job);
  }
}

async function printJob(job: PrintJob) {
  const settings = settingsCache ?? (await loadSettings());
  const printer = settings.printers.find((p) => p.station === job.station);
  if (!printer?.enabled || !printer.host) {
    await api(`/businesses/${BUSINESS_ID}/print-jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'FAILED',
        errorMessage: 'Printer not configured',
        executedBy: 'AGENT',
      }),
    });
    return;
  }

  try {
    const bytes = renderEscPosTicket(job.payload, printer.paperWidth);
    await sendTcpBytes(printer.host, printer.port, bytes);
    await api(`/businesses/${BUSINESS_ID}/print-jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'PRINTED',
        executedBy: 'AGENT',
      }),
    });
    console.log(`Printed job ${job.id} -> ${printer.host}:${printer.port}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Print failed';
    await api(`/businesses/${BUSINESS_ID}/print-jobs/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'FAILED',
        errorMessage: message,
        executedBy: 'AGENT',
      }),
    });
    console.error(`Job ${job.id} failed: ${message}`);
  }
}

async function heartbeat() {
  const settings = await loadSettings();
  const printers = [];
  for (const printer of settings.printers) {
    if (!printer.host) continue;
    const result = await probeTcp(printer.host, printer.port, 2000);
    printers.push({
      station: printer.station,
      online: result.online,
      latencyMs: result.latencyMs,
      error: result.error,
    });
  }
  await api(`/businesses/${BUSINESS_ID}/settings/print/agent/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ printers }),
  });
}

async function handleEvent(event: RealtimeEvent) {
  if (event.type === 'print.jobs.created') {
    await processPendingJobs();
    return;
  }
  if (event.type === 'print.discover.request' && event.requestId) {
    const printers = await scanLanForPrinters({ cidr: event.cidr });
    await api(`/businesses/${BUSINESS_ID}/settings/print/agent/discover-result`, {
      method: 'POST',
      body: JSON.stringify({ requestId: event.requestId, printers }),
    });
    console.log(`Discover ${event.requestId}: ${printers.length} found`);
    return;
  }
  if (event.type === 'print.probe.request' && event.requestId && event.host) {
    const result = await probeTcp(event.host, event.port ?? 9100);
    await api(`/businesses/${BUSINESS_ID}/settings/print/agent/probe-result`, {
      method: 'POST',
      body: JSON.stringify({
        requestId: event.requestId,
        station: event.station,
        online: result.online,
        latencyMs: result.latencyMs,
        error: result.error,
      }),
    });
  }
}

async function main() {
  await login();
  await loadSettings();
  await processPendingJobs();
  await heartbeat();

  const centrifuge = new Centrifuge(CENTRIFUGO_WS, {
    getToken: async () => realtimeToken(),
  });

  const sub = centrifuge.newSubscription(`business:${BUSINESS_ID}`);
  sub.on('publication', (ctx) => {
    void handleEvent(ctx.data as RealtimeEvent).catch((error) => {
      console.error('Event handler error', error);
    });
  });
  sub.subscribe();
  centrifuge.connect();

  setInterval(() => {
    void heartbeat().catch((error) => console.error('Heartbeat failed', error));
  }, HEARTBEAT_MS);

  setInterval(() => {
    void processPendingJobs().catch((error) => console.error('Poll failed', error));
  }, 30_000);

  console.log(`Print agent running for business ${BUSINESS_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
