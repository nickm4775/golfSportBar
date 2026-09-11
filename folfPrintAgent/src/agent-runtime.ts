import { v4 as uuidv4 } from 'uuid';
import { PrintApiClient, PrintJob, RemotePrinter } from './api';
import { renderEscPosTicket, TicketPayload } from './escpos';
import { printEscPos } from './print-dispatch';
import { LocalPrinter, store } from './store';
import {
  formatBluetoothAddress,
  normalizeNetworkAddress,
  parseBluetoothAddress,
  parseUsbAddress,
  formatUsbAddress,
} from './printer-address';

export type AgentStatus = {
  running: boolean;
  paired: boolean;
  message: string;
  lastError?: string;
};

type LogFn = (line: string) => void;

export class AgentRuntime {
  private static readonly MAX_PRINT_ATTEMPTS = 5;

  private api = new PrintApiClient(store.get('apiBaseUrl'), store.get('agentToken'));
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private processed = new Set<string>();
  private attemptCounts = new Map<string, number>();
  private inFlight = new Set<string>();
  private running = false;
  private onLog: LogFn = () => undefined;
  private onStatus: (status: AgentStatus) => void = () => undefined;

  setHandlers(handlers: { onLog?: LogFn; onStatus?: (s: AgentStatus) => void }) {
    if (handlers.onLog) this.onLog = handlers.onLog;
    if (handlers.onStatus) this.onStatus = handlers.onStatus;
  }

  getStatus(): AgentStatus {
    return {
      running: this.running,
      paired: Boolean(store.get('agentId') && store.get('agentToken')),
      message: this.running
        ? 'Agente en línea'
        : store.get('agentId')
          ? 'Emparejado (detenido)'
          : 'Sin emparejar',
      lastError: undefined,
    };
  }

  ensureDeviceId(): string {
    let id = store.get('deviceId');
    if (!id) {
      id = uuidv4();
      store.set('deviceId', id);
    }
    return id;
  }

  platform(): string {
    if (process.platform === 'win32') return 'windows';
    if (process.platform === 'darwin') return 'macos';
    if (process.platform === 'linux') return 'linux';
    return 'web';
  }

  async pair(code: string, apiBaseUrl?: string) {
    if (apiBaseUrl) store.set('apiBaseUrl', apiBaseUrl.replace(/\/$/, ''));
    this.api.setConfig(store.get('apiBaseUrl'), null);
    const result = await this.api.pair({
      code: code.trim().toUpperCase(),
      deviceId: this.ensureDeviceId(),
      deviceName: `Negocenda Tray (${this.platform()})`,
      platform: this.platform(),
    });
    store.set('agentId', result.agent.id);
    store.set('agentToken', result.agentToken);
    store.set('businessId', result.businessId);
    this.api.setConfig(store.get('apiBaseUrl'), result.agentToken);
    this.log(`Emparejado con negocio ${result.businessId}`);
    this.emitStatus();
    return result;
  }

  getPrinters(): LocalPrinter[] {
    return store.get('printers') ?? [];
  }

  /** Normalize address so IP and IP:9100 (or USB formats) don't create silent duplicates / collisions. */
  private normalizePrinterAddress(
    connectionType: LocalPrinter['connectionType'],
    address: string,
  ): string {
    const trimmed = address.trim();
    if (connectionType === 'network') {
      return normalizeNetworkAddress(trimmed);
    }
    if (connectionType === 'bluetooth') {
      return formatBluetoothAddress(parseBluetoothAddress(trimmed).mac);
    }
    if (connectionType === 'usb') {
      const parsed = parseUsbAddress(trimmed);
      return formatUsbAddress(parsed.vendorId, parsed.productId, {
        serial: parsed.serial,
        busNumber: parsed.busNumber,
        deviceAddress: parsed.deviceAddress,
      });
    }
    return trimmed;
  }

  savePrinter(printer: LocalPrinter): { printers: LocalPrinter[]; updatedExisting: boolean } {
    const address = this.normalizePrinterAddress(printer.connectionType, printer.address);
    const normalized = { ...printer, address };
    const existing = this.getPrinters().find((p) => p.address === address);
    const next = [
      ...this.getPrinters().filter((p) => p.address !== address),
      {
        ...existing,
        ...normalized,
        id: printer.id ?? existing?.id,
        lastSeenAt: new Date().toISOString(),
      },
    ];
    store.set('printers', next);
    if (this.running) void this.heartbeat();
    if (existing) {
      this.log(`Impresora actualizada (misma dirección): ${normalized.name} · ${address}`);
    } else {
      this.log(`Impresora agregada: ${normalized.name} · ${address} (total ${next.length})`);
    }
    return { printers: next, updatedExisting: Boolean(existing) };
  }

  updatePrinter(address: string, patch: Partial<LocalPrinter>) {
    const next = this.getPrinters().map((p) =>
      p.address === address
        ? { ...p, ...patch, address: patch.address ?? p.address }
        : p,
    );
    store.set('printers', next);
    if (this.running) void this.heartbeat();
    return next;
  }

  removePrinter(address: string) {
    const next = this.getPrinters().filter((p) => p.address !== address);
    store.set('printers', next);
    if (this.running) void this.heartbeat();
    return next;
  }

  private mergeRemoteIds(remote: RemotePrinter[]) {
    if (!remote?.length) return;
    const byAddress = new Map(remote.map((p) => [p.address, p]));
    const next = this.getPrinters().map((local) => {
      const match = byAddress.get(local.address);
      if (!match) return local;
      return {
        ...local,
        id: match.id,
        isOnline: match.isOnline ?? local.isOnline,
        paperWidth: match.paperWidth ?? local.paperWidth,
        lastSeenAt: new Date().toISOString(),
      };
    });
    store.set('printers', next);

    const missingId = next.filter((p) => !p.id);
    if (missingId.length) {
      this.log(
        `${missingId.length} impresora(s) aún sin id de servidor (se sincronizan en el próximo heartbeat): ${missingId
          .map((p) => p.name)
          .join(', ')}`,
      );
    }
  }

  resolvePrinterForJob(job: PrintJob): LocalPrinter | null {
    const printers = this.getPrinters();
    if (!printers.length) return null;

    if (job.printerId) {
      const byId = printers.find((p) => p.id === job.printerId);
      if (byId) return byId;
      return null;
    }

    if (printers.length === 1) return printers[0];

    return null;
  }

  private resolveFailureReason(job: PrintJob): string {
    const printers = this.getPrinters();
    if (!printers.length) {
      return 'No hay impresoras configuradas en el agente';
    }
    if (job.printerId) {
      const pendingSync = printers.some((p) => !p.id);
      if (pendingSync) {
        return `Sin match local para printerId ${job.printerId} (hay impresoras sin id de servidor; espera al próximo heartbeat)`;
      }
      return `Sin impresora local para printerId ${job.printerId} (hay ${printers.length} configurada(s); revisa rutas en el dashboard)`;
    }
    return `Hay ${printers.length} impresoras; el trabajo no trae printerId. Asigna rutas en Configuración de impresión.`;
  }

  async testPrint(address: string) {
    const printer = this.getPrinters().find((p) => p.address === address);
    if (!printer) throw new Error('Impresora no encontrada');
    const bytes = renderEscPosTicket(
      {
        businessName: printer.name,
        stationLabel: 'TEST PRINT',
        tableLabel: 'TEST',
        createdAtLabel: new Date().toLocaleString(),
        notes: `${printer.connectionType} - ${printer.address}`,
        lines: [{ quantity: 1, name: 'Ticket de prueba' }],
        isTest: true,
      },
      printer.paperWidth,
    );
    await printEscPos(printer, bytes);
    this.log(`Prueba OK → ${printer.name} (${printer.address})`);
  }

  async start() {
    const agentId = store.get('agentId');
    const token = store.get('agentToken');
    const businessId = store.get('businessId');
    if (!agentId || !token || !businessId) {
      throw new Error('Empareja el agente primero');
    }
    this.api.setConfig(store.get('apiBaseUrl'), token);
    this.running = true;
    this.emitStatus();
    await this.heartbeat();
    this.heartbeatTimer = setInterval(() => void this.heartbeat(), 20_000);
    this.pollTimer = setInterval(() => void this.pullPending(), 25_000);
    await this.pullPending();
    this.log('Agente iniciado');
  }

  stop() {
    this.running = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.heartbeatTimer = null;
    this.pollTimer = null;
    this.processed.clear();
    this.attemptCounts.clear();
    this.inFlight.clear();
    this.emitStatus();
    this.log('Agente detenido');
  }

  unpair() {
    this.stop();
    store.set('agentId', null);
    store.set('agentToken', null);
    store.set('businessId', null);
    this.api.setConfig(store.get('apiBaseUrl'), null);
    this.emitStatus();
  }

  private async heartbeat() {
    const agentId = store.get('agentId');
    if (!agentId || !this.running) return;
    try {
      const result = await this.api.heartbeat(agentId, this.getPrinters());
      if (result.printers?.length) {
        this.mergeRemoteIds(result.printers);
      }
      for (const job of result.pendingJobs ?? []) {
        await this.handleJob(job);
      }
      this.log('Heartbeat OK');
    } catch (error) {
      this.log(`Heartbeat error: ${(error as Error).message}`);
    }
  }

  private async pullPending() {
    const agentId = store.get('agentId');
    const businessId = store.get('businessId');
    if (!agentId || !businessId || !this.running) return;
    try {
      const jobs = await this.api.pendingJobs(businessId, agentId);
      for (const job of jobs) {
        await this.handleJob(job);
      }
    } catch (error) {
      this.log(`Poll error: ${(error as Error).message}`);
    }
  }

  private async handleJob(job: PrintJob) {
    const jobId = job.id;
    if (!jobId || this.processed.has(jobId) || this.inFlight.has(jobId)) return;

    const agentId = store.get('agentId');
    if (!agentId) return;

    this.inFlight.add(jobId);
    try {
      const attempt =
        Math.max(this.attemptCounts.get(jobId) ?? 0, Number(job.attempts) || 0) + 1;
      this.attemptCounts.set(jobId, attempt);

      const target = this.resolvePrinterForJob(job);
      if (!target) {
        const reason = this.resolveFailureReason(job);
        if (attempt >= AgentRuntime.MAX_PRINT_ATTEMPTS) {
          this.processed.add(jobId);
          await this.api.ackJob(jobId, 'failed', agentId, reason);
          this.log(`Job ${jobId} failed (intento ${attempt}): ${reason}`);
          return;
        }
        this.log(`Job ${jobId} reintento ${attempt}/${AgentRuntime.MAX_PRINT_ATTEMPTS}: ${reason}`);
        return;
      }

      try {
        const payload = (job.payload ?? {}) as TicketPayload;
        const bytes = renderEscPosTicket(payload, target.paperWidth);
        await printEscPos(target, bytes);
        this.processed.add(jobId);
        this.attemptCounts.delete(jobId);
        await this.api.ackJob(jobId, 'printed', agentId);
        this.log(`Job ${jobId} printed → ${target.name} (${target.address})`);
      } catch (error) {
        const message = (error as Error).message;
        if (attempt >= AgentRuntime.MAX_PRINT_ATTEMPTS) {
          this.processed.add(jobId);
          await this.api.ackJob(jobId, 'failed', agentId, message);
          this.log(`Job ${jobId} failed (intento ${attempt}): ${message}`);
          return;
        }
        this.log(
          `Job ${jobId} error (intento ${attempt}/${AgentRuntime.MAX_PRINT_ATTEMPTS}, se reintentará): ${message}`,
        );
      }
    } finally {
      this.inFlight.delete(jobId);
    }
  }

  private log(message: string) {
    const stamp = new Date().toISOString().slice(11, 19);
    this.onLog(`${stamp}  ${message}`);
  }

  private emitStatus() {
    this.onStatus(this.getStatus());
  }
}

export const agentRuntime = new AgentRuntime();
