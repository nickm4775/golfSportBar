import { randomUUID } from 'node:crypto';
import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../../../shared/infrastructure/database/entities/business.entity';
import { BusinessPrintSettings } from '../../../shared/infrastructure/database/entities/business-print-settings.entity';
import { BusinessPrinter } from '../../../shared/infrastructure/database/entities/business-printer.entity';
import { PrintJob } from '../../../shared/infrastructure/database/entities/print-job.entity';
import { AgentPrinter } from '../../../shared/infrastructure/database/entities/agent-printer.entity';
import { PrintAgent } from '../../../shared/infrastructure/database/entities/print-agent.entity';
import { Order } from '../../../shared/infrastructure/database/entities/order.entity';
import { OrderItem } from '../../../shared/infrastructure/database/entities/order-item.entity';
import { Payment } from '../../../shared/infrastructure/database/entities/payment.entity';
import {
  PrepStation,
  PrintExecutionMode,
  PrintJobExecutedBy,
  PrintJobStatus,
  PrinterConnectionStatus,
} from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';
import { BusinessRealtimeService } from '../../realtime/application/business-realtime.service';
import {
  renderEscPosReceipt,
  renderEscPosTicket,
  type ReceiptPayload,
  type TicketPayload,
} from '../infrastructure/escpos';
import { probeTcp, scanLanForPrinters, sendTcpBytes } from '../infrastructure/lan';
import { paymentMethodLabel } from './payment-method-label';
import {
  AgentDiscoverResultDto,
  AgentHeartbeatDto,
  AgentProbeResultDto,
  DiscoverPrintersDto,
  UpdatePrintJobDto,
  UpsertPrinterDto,
  UpdatePrintSettingsDto,
} from '../presentation/dto/print.dto';

const AGENT_ONLINE_MS = 90_000;
const DISCOVER_WAIT_MS = 30_000;
const KITCHEN_SLUGS = new Set(['petiscos', 'pizzas', 'burgers', 'sobremesas']);

@Injectable()
export class PrintService {
  private readonly logger = new Logger(PrintService.name);

  constructor(
    @InjectRepository(BusinessPrintSettings)
    private readonly settingsRepo: Repository<BusinessPrintSettings>,
    @InjectRepository(BusinessPrinter)
    private readonly printerRepo: Repository<BusinessPrinter>,
    @InjectRepository(PrintJob)
    private readonly jobRepo: Repository<PrintJob>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(AgentPrinter)
    private readonly agentPrinterRepo: Repository<AgentPrinter>,
    @InjectRepository(PrintAgent)
    private readonly printAgentRepo: Repository<PrintAgent>,
    private readonly cache: RedisCacheService,
    private readonly config: ConfigService,
    @Optional() private readonly realtime?: BusinessRealtimeService,
  ) {}

  effectivePrepStation(product: {
    prepStation?: PrepStation | null;
    category?: { prepStation?: PrepStation; slug?: string } | null;
  }): PrepStation {
    if (product.prepStation) return product.prepStation;
    if (product.category?.prepStation) return product.category.prepStation;
    if (product.category?.slug && KITCHEN_SLUGS.has(product.category.slug)) {
      return PrepStation.KITCHEN;
    }
    return PrepStation.BAR;
  }

  async ensureSettings(businessId: string) {
    let settings = await this.settingsRepo.findOne({ where: { businessId } });
    if (!settings) {
      const defaultMode =
        (this.config.get<string>('PRINT_DEFAULT_MODE')?.toUpperCase() as PrintExecutionMode) ||
        PrintExecutionMode.AGENT;
      settings = await this.settingsRepo.save({
        businessId,
        printExecutionMode:
          defaultMode === PrintExecutionMode.DIRECT
            ? PrintExecutionMode.DIRECT
            : PrintExecutionMode.AGENT,
      });
    }
    for (const station of [PrepStation.KITCHEN, PrepStation.BAR, PrepStation.RECEIPT]) {
      const existing = await this.printerRepo.findOne({ where: { businessId, station } });
      if (!existing) {
        await this.printerRepo.save({
          businessId,
          station,
          name:
            station === PrepStation.KITCHEN ? 'Cocina' : station === PrepStation.BAR ? 'Bar' : 'Recibo',
        });
      }
    }
    return settings;
  }

  async getSettings(businessId: string) {
    const settings = await this.ensureSettings(businessId);
    const printers = await this.printerRepo.find({
      where: { businessId },
      order: { station: 'ASC' },
    });
    return await this.presentSettings(settings, printers);
  }

  async updateSettings(businessId: string, dto: UpdatePrintSettingsDto) {
    const settings = await this.ensureSettings(businessId);
    if (dto.printExecutionMode) {
      settings.printExecutionMode = dto.printExecutionMode;
      await this.settingsRepo.save(settings);
    }
    return this.getSettings(businessId);
  }

  async upsertPrinter(businessId: string, station: PrepStation, dto: UpsertPrinterDto) {
    const settings = await this.ensureSettings(businessId);
    let printer = await this.printerRepo.findOne({ where: { businessId, station } });
    if (!printer) {
      printer = this.printerRepo.create({ businessId, station, name: station });
    }
    if (dto.name !== undefined) printer.name = dto.name;
    if (dto.host !== undefined) printer.host = dto.host?.trim() || null;
    if (dto.port !== undefined) printer.port = dto.port;
    if (dto.enabled !== undefined) printer.enabled = dto.enabled;
    if (dto.paperWidth !== undefined) printer.paperWidth = dto.paperWidth;
    if (dto.agentPrinterId !== undefined) {
      if (dto.agentPrinterId) {
        const agentPrinter = await this.agentPrinterRepo.findOne({
          where: { id: dto.agentPrinterId, businessId },
        });
        if (!agentPrinter) {
          throw new DomainException(
            'Agent printer not found for this business',
            'AGENT_PRINTER_NOT_FOUND',
            400,
          );
        }
        printer.agentPrinterId = agentPrinter.id;
      } else {
        printer.agentPrinterId = null;
      }
    }
    await this.printerRepo.save(printer);

    if (printer.host && settings.printExecutionMode === PrintExecutionMode.DIRECT) {
      await this.probePrinter(businessId, station);
    }
    return this.getSettings(businessId);
  }

  async discover(businessId: string, dto: DiscoverPrintersDto) {
    const settings = await this.ensureSettings(businessId);
    if (settings.printExecutionMode === PrintExecutionMode.DIRECT) {
      const printers = await scanLanForPrinters({ cidr: dto.cidr });
      return { printers, mode: settings.printExecutionMode };
    }

    if (!(await this.isAgentOnline(settings))) {
      throw new DomainException('Print agent is not connected', 'PRINT_AGENT_OFFLINE', 503);
    }

    const requestId = randomUUID();
    await this.cache.setJson(
      this.discoverKey(requestId),
      { status: 'pending' },
      60,
    );
    await this.realtime?.notify(businessId, {
      type: 'print.discover.request',
      requestId,
      cidr: dto.cidr,
    });

    const deadline = Date.now() + DISCOVER_WAIT_MS;
    while (Date.now() < deadline) {
      const result = await this.cache.getJson<{
        status: string;
        printers?: Array<{ host: string; port: number; latencyMs: number }>;
      }>(this.discoverKey(requestId));
      if (result?.status === 'done') {
        return {
          printers: result.printers ?? [],
          mode: settings.printExecutionMode,
          requestId,
        };
      }
      await sleep(500);
    }
    throw new DomainException('Discover timed out waiting for agent', 'PRINT_DISCOVER_TIMEOUT', 504);
  }

  async receiveDiscoverResult(businessId: string, dto: AgentDiscoverResultDto) {
    await this.ensureSettings(businessId);
    await this.cache.setJson(
      this.discoverKey(dto.requestId),
      { status: 'done', printers: dto.printers },
      60,
    );
    return { ok: true };
  }

  async probePrinter(businessId: string, station: PrepStation) {
    const settings = await this.ensureSettings(businessId);
    const printer = await this.requirePrinter(businessId, station);
    if (!printer.host) {
      throw new DomainException('Printer host is not configured', 'PRINTER_HOST_MISSING', 400);
    }

    if (settings.printExecutionMode === PrintExecutionMode.DIRECT) {
      const result = await probeTcp(printer.host, printer.port);
      await this.applyProbe(printer, result.online, result.latencyMs, result.error);
      return {
        station,
        status: printer.connectionStatus,
        latencyMs: result.latencyMs,
        error: result.error,
      };
    }

    if (!(await this.isAgentOnline(settings))) {
      throw new DomainException('Print agent is not connected', 'PRINT_AGENT_OFFLINE', 503);
    }

    const requestId = randomUUID();
    await this.cache.setJson(this.probeKey(requestId), { status: 'pending' }, 60);
    await this.realtime?.notify(businessId, {
      type: 'print.probe.request',
      requestId,
      station,
      host: printer.host,
      port: printer.port,
    });

    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const result = await this.cache.getJson<{
        status: string;
        online?: boolean;
        latencyMs?: number;
        error?: string;
      }>(this.probeKey(requestId));
      if (result?.status === 'done') {
        await this.applyProbe(
          printer,
          Boolean(result.online),
          result.latencyMs,
          result.error,
        );
        return {
          station,
          status: printer.connectionStatus,
          latencyMs: result.latencyMs,
          error: result.error,
        };
      }
      await sleep(400);
    }
    throw new DomainException('Probe timed out waiting for agent', 'PRINT_PROBE_TIMEOUT', 504);
  }

  async receiveProbeResult(businessId: string, dto: AgentProbeResultDto) {
    await this.ensureSettings(businessId);
    await this.cache.setJson(
      this.probeKey(dto.requestId),
      {
        status: 'done',
        online: dto.online,
        latencyMs: dto.latencyMs,
        error: dto.error,
      },
      60,
    );
    if (dto.station) {
      const printer = await this.printerRepo.findOne({
        where: { businessId, station: dto.station },
      });
      if (printer) {
        await this.applyProbe(printer, dto.online, dto.latencyMs, dto.error);
      }
    }
    return { ok: true };
  }

  async agentHeartbeat(businessId: string, dto: AgentHeartbeatDto) {
    const settings = await this.ensureSettings(businessId);
    settings.agentLastSeenAt = new Date();
    await this.settingsRepo.save(settings);

    for (const item of dto.printers ?? []) {
      const printer = await this.printerRepo.findOne({
        where: { businessId, station: item.station },
      });
      if (!printer) continue;
      await this.applyProbe(printer, item.online, item.latencyMs, item.error);
    }

    await this.realtime?.notify(businessId, {
      type: 'print.agent.status',
      entityId: businessId,
    });

    return {
      agentOnline: true,
      agentLastSeenAt: settings.agentLastSeenAt,
    };
  }

  async enqueueForOrderItems(businessId: string, orderId: string, itemIds: string[]) {
    if (!itemIds.length) return [];

    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
      relations: {
        items: { product: { category: true } },
        business: true,
      },
    });
    if (!order) return [];

    const business =
      order.business ??
      (await this.businessRepo.findOneByOrFail({ id: businessId }));

    const targetItems = (order.items ?? []).filter((item) => itemIds.includes(item.id));
    if (!targetItems.length) return [];

    const byStation = new Map<PrepStation, OrderItem[]>();
    for (const item of targetItems) {
      const station = this.effectivePrepStation(item.product);
      const list = byStation.get(station) ?? [];
      list.push(item);
      byStation.set(station, list);
    }

    const settings = await this.ensureSettings(businessId);
    const jobs: PrintJob[] = [];

    for (const [station, items] of byStation) {
      const printer = await this.printerRepo.findOne({ where: { businessId, station } });
      const payload = this.buildTicketPayload({
        businessName: business.name,
        station,
        tableLabel: order.tableLabel,
        notes: order.notes,
        createdAt: order.createdAt,
        timezone: business.timezone,
        items,
      });

      let status = PrintJobStatus.PENDING;
      let errorMessage: string | null = null;
      let printerId: string | null = null;

      if (!printer?.enabled) {
        status = PrintJobStatus.FAILED;
        errorMessage = 'Printer disabled';
      } else if (settings.printExecutionMode === PrintExecutionMode.AGENT) {
        if (!printer.agentPrinterId) {
          status = PrintJobStatus.FAILED;
          errorMessage = 'Agent printer not assigned for station';
        } else {
          printerId = printer.agentPrinterId;
        }
      } else if (!printer.host) {
        status = PrintJobStatus.FAILED;
        errorMessage = 'Printer host not configured';
      } else if (
        settings.printExecutionMode === PrintExecutionMode.DIRECT &&
        printer.connectionStatus === PrinterConnectionStatus.OFFLINE
      ) {
        status = PrintJobStatus.FAILED;
        errorMessage = 'Printer offline';
      }

      const job = await this.jobRepo.save({
        businessId,
        orderId,
        station,
        status,
        payload,
        errorMessage,
        printerId,
      });
      jobs.push(job);
    }

    const pending = jobs.filter((job) => job.status === PrintJobStatus.PENDING);
    if (pending.length) {
      await this.dispatch(businessId, pending, settings.printExecutionMode);
    }
    return jobs;
  }

  async enqueueReceiptForOrder(businessId: string, orderId: string): Promise<PrintJob> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
      relations: {
        items: { product: true },
        business: true,
        customer: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const business =
      order.business ?? (await this.businessRepo.findOneByOrFail({ id: businessId }));

    const latestPayment = [...(order.payments ?? [])].sort((a, b) => {
      const byDate = Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt));
      return byDate !== 0 ? byDate : b.id.localeCompare(a.id);
    })[0];

    const settings = await this.ensureSettings(businessId);
    const printer = await this.printerRepo.findOne({
      where: { businessId, station: PrepStation.RECEIPT },
    });

    const payload = this.buildReceiptPayload({
      businessName: business.name,
      tableLabel: order.tableLabel,
      customerName: order.customer?.fullName,
      createdAt: order.createdAt,
      timezone: business.timezone,
      items: order.items ?? [],
      subtotalBrl: order.totalBrl - order.serviceChargeBrl,
      serviceChargeBrl: order.includeServiceCharge ? order.serviceChargeBrl : null,
      totalBrl: order.totalBrl,
      payment: latestPayment,
    });

    let status = PrintJobStatus.PENDING;
    let errorMessage: string | null = null;
    let printerId: string | null = null;

    if (!printer?.enabled) {
      status = PrintJobStatus.FAILED;
      errorMessage = 'Printer disabled';
    } else if (settings.printExecutionMode === PrintExecutionMode.AGENT) {
      if (!printer.agentPrinterId) {
        status = PrintJobStatus.FAILED;
        errorMessage = 'Agent printer not assigned for station';
      } else {
        printerId = printer.agentPrinterId;
      }
    } else if (!printer.host) {
      status = PrintJobStatus.FAILED;
      errorMessage = 'Printer host not configured';
    } else if (
      settings.printExecutionMode === PrintExecutionMode.DIRECT &&
      printer.connectionStatus === PrinterConnectionStatus.OFFLINE
    ) {
      status = PrintJobStatus.FAILED;
      errorMessage = 'Printer offline';
    }

    const job = await this.jobRepo.save({
      businessId,
      orderId,
      station: PrepStation.RECEIPT,
      status,
      payload,
      errorMessage,
      printerId,
    });

    if (job.status === PrintJobStatus.PENDING) {
      await this.dispatch(businessId, [job], settings.printExecutionMode);
      return job;
    }

    throw new DomainException(
      job.errorMessage ?? 'Receipt printer not ready',
      'PRINT_RECEIPT_FAILED',
      400,
    );
  }

  async enqueueTest(businessId: string, station: PrepStation) {
    const business = await this.businessRepo.findOneByOrFail({ id: businessId });
    const settings = await this.ensureSettings(businessId);
    const printer = await this.requirePrinter(businessId, station);
    if (!printer.enabled) {
      throw new DomainException('Printer not ready', 'PRINTER_NOT_READY', 400);
    }
    if (settings.printExecutionMode === PrintExecutionMode.AGENT) {
      if (!printer.agentPrinterId) {
        throw new DomainException(
          'Agent printer not assigned for station',
          'AGENT_PRINTER_NOT_ASSIGNED',
          400,
        );
      }
    } else if (!printer.host) {
      throw new DomainException('Printer not ready', 'PRINTER_NOT_READY', 400);
    }

    const payload = this.buildTicketPayload({
      businessName: business.name,
      station,
      tableLabel: 'TEST',
      notes: 'Prueba de impresion',
      createdAt: new Date(),
      timezone: business.timezone,
      items: [
        {
          quantity: 1,
          product: { namePt: 'Item de prueba' },
          notes: null,
        } as OrderItem,
      ],
      isTest: true,
    });

    const job = await this.jobRepo.save({
      businessId,
      orderId: null,
      station,
      status: PrintJobStatus.PENDING,
      payload,
      printerId:
        settings.printExecutionMode === PrintExecutionMode.AGENT
          ? printer.agentPrinterId
          : null,
    });

    await this.dispatch(businessId, [job], settings.printExecutionMode);
    return job;
  }

  async listJobs(businessId: string, status?: PrintJobStatus) {
    const where = status ? { businessId, status } : { businessId };
    return this.jobRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async updateJob(businessId: string, jobId: string, dto: UpdatePrintJobDto) {
    const job = await this.jobRepo.findOne({ where: { id: jobId, businessId } });
    if (!job) throw new NotFoundException('Print job not found');
    job.status = dto.status;
    job.errorMessage = dto.errorMessage ?? null;
    job.executedBy = dto.executedBy ?? PrintJobExecutedBy.AGENT;
    if (dto.status === PrintJobStatus.PRINTED) {
      job.printedAt = new Date();
    }
    await this.jobRepo.save(job);
    return job;
  }

  private async dispatch(
    businessId: string,
    jobs: PrintJob[],
    mode: PrintExecutionMode,
  ) {
    if (mode === PrintExecutionMode.AGENT) {
      await this.realtime?.notify(businessId, {
        type: 'print.jobs.created',
        jobIds: jobs.map((job) => job.id),
      });
      return;
    }

    for (const job of jobs) {
      void this.executeDirect(job).catch((error: Error) => {
        this.logger.warn(`Direct print failed ${job.id}: ${error.message}`);
      });
    }
  }

  private async executeDirect(job: PrintJob) {
    const printer = await this.printerRepo.findOne({
      where: { businessId: job.businessId, station: job.station },
    });
    if (!printer?.host) {
      await this.jobRepo.update(job.id, {
        status: PrintJobStatus.FAILED,
        errorMessage: 'Printer host not configured',
        executedBy: PrintJobExecutedBy.SERVER,
      });
      return;
    }

    try {
      const bytes =
        job.station === PrepStation.RECEIPT
          ? renderEscPosReceipt(job.payload as unknown as ReceiptPayload, printer.paperWidth)
          : renderEscPosTicket(job.payload as unknown as TicketPayload, printer.paperWidth);
      await sendTcpBytes(printer.host, printer.port, bytes);
      await this.jobRepo.update(job.id, {
        status: PrintJobStatus.PRINTED,
        printedAt: new Date(),
        executedBy: PrintJobExecutedBy.SERVER,
        errorMessage: null,
      });
      await this.applyProbe(printer, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Print failed';
      await this.jobRepo.update(job.id, {
        status: PrintJobStatus.FAILED,
        errorMessage: message,
        executedBy: PrintJobExecutedBy.SERVER,
      });
      await this.applyProbe(printer, false, undefined, message);
    }
  }

  private buildTicketPayload(input: {
    businessName: string;
    station: PrepStation;
    tableLabel?: string | null;
    notes?: string | null;
    createdAt: Date;
    timezone: string;
    items: Array<{ quantity: number; notes?: string | null; product: { namePt: string } }>;
    isTest?: boolean;
  }): TicketPayload {
    return {
      businessName: input.businessName,
      stationLabel: input.station === PrepStation.KITCHEN ? 'COCINA' : 'BAR',
      tableLabel: input.tableLabel,
      notes: input.notes,
      createdAtLabel: formatInTimezone(input.createdAt, input.timezone),
      lines: input.items.map((item) => ({
        quantity: item.quantity,
        name: item.product.namePt,
        notes: item.notes,
      })),
      isTest: input.isTest,
    };
  }

  private buildReceiptPayload(input: {
    businessName: string;
    tableLabel?: string | null;
    customerName?: string | null;
    createdAt: Date;
    timezone: string;
    items: Array<{ quantity: number; unitPriceBrl: number; product: { namePt: string } }>;
    subtotalBrl: number;
    serviceChargeBrl?: number | null;
    totalBrl: number;
    payment?: Payment | null;
  }): ReceiptPayload {
    return {
      businessName: input.businessName,
      tableLabel: input.tableLabel,
      customerName: input.customerName,
      createdAtLabel: formatInTimezone(input.createdAt, input.timezone),
      lines: input.items.map((item) => ({
        quantity: item.quantity,
        name: item.product.namePt,
        unitPriceLabel: formatBrl(item.unitPriceBrl),
        lineTotalLabel: formatBrl(item.unitPriceBrl * item.quantity),
      })),
      subtotalLabel: formatBrl(input.subtotalBrl),
      serviceChargeLabel: input.serviceChargeBrl != null ? formatBrl(input.serviceChargeBrl) : null,
      totalLabel: formatBrl(input.totalBrl),
      paymentMethodLabel: paymentMethodLabel(input.payment?.method),
      paymentStatusLabel: input.payment?.status ?? null,
    };
  }

  private async applyProbe(
    printer: BusinessPrinter,
    online: boolean,
    latencyMs?: number,
    error?: string,
  ) {
    printer.connectionStatus = online
      ? PrinterConnectionStatus.ONLINE
      : PrinterConnectionStatus.OFFLINE;
    printer.lastSeenAt = online ? new Date() : printer.lastSeenAt;
    printer.lastError = online ? null : error ?? 'offline';
    await this.printerRepo.save(printer);
    return latencyMs;
  }

  private async requirePrinter(businessId: string, station: PrepStation) {
    await this.ensureSettings(businessId);
    const printer = await this.printerRepo.findOne({ where: { businessId, station } });
    if (!printer) throw new NotFoundException('Printer not found');
    return printer;
  }

  async isAgentOnline(settings: BusinessPrintSettings) {
    if (settings.agentLastSeenAt) {
      const seenRecently =
        Date.now() - new Date(settings.agentLastSeenAt).getTime() < AGENT_ONLINE_MS;
      if (seenRecently) return true;
    }

    const agents = await this.printAgentRepo.find({
      where: { businessId: settings.businessId },
      take: 5,
    });
    return agents.some(
      (agent) =>
        !agent.revokedAt &&
        agent.lastSeenAt &&
        Date.now() - agent.lastSeenAt.getTime() < AGENT_ONLINE_MS,
    );
  }

  private async presentSettings(settings: BusinessPrintSettings, printers: BusinessPrinter[]) {
    return {
      printExecutionMode: settings.printExecutionMode,
      agentLastSeenAt: settings.agentLastSeenAt,
      agentOnline: await this.isAgentOnline(settings),
      printers: printers.map((printer) => ({
        id: printer.id,
        station: printer.station,
        name: printer.name,
        host: printer.host,
        port: printer.port,
        enabled: printer.enabled,
        paperWidth: printer.paperWidth,
        connectionStatus: printer.connectionStatus,
        lastSeenAt: printer.lastSeenAt,
        lastError: printer.lastError,
        agentPrinterId: printer.agentPrinterId,
      })),
    };
  }

  private discoverKey(requestId: string) {
    return `print:discover:${requestId}`;
  }

  private probeKey(requestId: string) {
    return `print:probe:${requestId}`;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatBrl(value: number): string {
  return `R$ ${value.toFixed(2)}`;
}

function formatInTimezone(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone || 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
