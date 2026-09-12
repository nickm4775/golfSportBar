import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrintAgent } from '../../../shared/infrastructure/database/entities/print-agent.entity';
import { PrintAgentPairingCode } from '../../../shared/infrastructure/database/entities/print-agent-pairing-code.entity';
import { AgentPrinter } from '../../../shared/infrastructure/database/entities/agent-printer.entity';
import { BusinessPrintSettings } from '../../../shared/infrastructure/database/entities/business-print-settings.entity';
import { PrintJob } from '../../../shared/infrastructure/database/entities/print-job.entity';
import {
  PrintExecutionMode,
  PrintJobExecutedBy,
  PrintJobStatus,
  PrinterConnectionType,
} from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';
import {
  AgentRuntimeHeartbeatDto,
  PairAgentDto,
} from '../presentation/dto/print-agent.dto';
import { PrintService } from './print.service';

const AGENT_ONLINE_MS = 90_000;
const CLAIM_TTL_MS = 60_000;
// Pairing codes are single-use (usedAt gates redemption), so a long TTL only avoids a
// stale-code UX annoyance without weakening security.
const PAIRING_TTL_MS = 10 * 365 * 24 * 60 * 60 * 1000;
const PAIRING_RATE_LIMIT = 3;
const PAIRING_RATE_WINDOW_SEC = 600;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type PrintAgentContext = {
  agentId: string;
  businessId: string;
};

@Injectable()
export class PrintAgentService {
  constructor(
    @InjectRepository(PrintAgent)
    private readonly agentRepo: Repository<PrintAgent>,
    @InjectRepository(PrintAgentPairingCode)
    private readonly pairingRepo: Repository<PrintAgentPairingCode>,
    @InjectRepository(AgentPrinter)
    private readonly agentPrinterRepo: Repository<AgentPrinter>,
    @InjectRepository(BusinessPrintSettings)
    private readonly settingsRepo: Repository<BusinessPrintSettings>,
    @InjectRepository(PrintJob)
    private readonly jobRepo: Repository<PrintJob>,
    private readonly cache: RedisCacheService,
    private readonly printService: PrintService,
  ) {}

  async resolveAgentFromToken(token: string): Promise<PrintAgentContext> {
    const dot = token.indexOf('.');
    if (dot <= 0) {
      throw new UnauthorizedException('Invalid agent token');
    }
    const agentId = token.slice(0, dot);
    const agent = await this.agentRepo.findOne({ where: { id: agentId } });
    if (!agent?.tokenHash || agent.revokedAt) {
      throw new UnauthorizedException('Invalid agent token');
    }
    const valid = await bcrypt.compare(token, agent.tokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid agent token');
    }
    return { agentId: agent.id, businessId: agent.businessId };
  }

  async createPairingCode(businessId: string, userId: string) {
    const settings = await this.printService.ensureSettings(businessId);
    if (settings.printExecutionMode !== PrintExecutionMode.AGENT) {
      throw new DomainException(
        'Print mode must be AGENT to pair devices',
        'PRINT_MODE_NOT_AGENT',
        400,
      );
    }

    const rateKey = `print:pairing:rate:${businessId}`;
    const count = Number((await this.cache.getJson<number>(rateKey)) ?? 0);
    if (count >= PAIRING_RATE_LIMIT) {
      throw new DomainException(
        'Too many pairing codes requested',
        'PAIRING_RATE_LIMIT',
        429,
      );
    }
    await this.cache.setJson(rateKey, count + 1, PAIRING_RATE_WINDOW_SEC);

    const code = this.generatePairingCode();
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
    await this.pairingRepo.save({
      businessId,
      code,
      expiresAt,
      createdByUserId: userId,
    });

    return {
      code,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds: Math.floor(PAIRING_TTL_MS / 1000),
    };
  }

  async pair(dto: PairAgentDto) {
    const code = dto.code.trim().toUpperCase();
    const pairing = await this.pairingRepo.findOne({
      where: { code },
      order: { createdAt: 'DESC' },
    });

    if (!pairing || pairing.usedAt || pairing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired pairing code');
    }

    const settings = await this.printService.ensureSettings(pairing.businessId);
    if (settings.printExecutionMode !== PrintExecutionMode.AGENT) {
      throw new DomainException(
        'Print mode must be AGENT to pair devices',
        'PRINT_MODE_NOT_AGENT',
        400,
      );
    }

    pairing.usedAt = new Date();
    await this.pairingRepo.save(pairing);

    let agent = await this.agentRepo.findOne({ where: { deviceId: dto.deviceId } });
    if (agent && agent.businessId !== pairing.businessId) {
      await this.agentRepo.update(agent.id, { revokedAt: new Date() });
      agent = null;
    }

    if (!agent) {
      agent = this.agentRepo.create({
        businessId: pairing.businessId,
        deviceId: dto.deviceId,
        deviceName: dto.deviceName,
        platform: dto.platform,
        tokenHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
      });
    } else {
      agent.revokedAt = null;
      agent.deviceName = dto.deviceName;
      agent.platform = dto.platform;
      agent.businessId = pairing.businessId;
    }

    agent.lastSeenAt = new Date();
    agent = await this.agentRepo.save(agent);

    const secret = randomBytes(24).toString('base64url');
    const token = `${agent.id}.${secret}`;
    agent.tokenHash = await bcrypt.hash(token, 10);
    await this.agentRepo.save(agent);

    settings.agentLastSeenAt = agent.lastSeenAt;
    await this.settingsRepo.save(settings);

    return {
      agent: { id: agent.id },
      agentToken: token,
      businessId: pairing.businessId,
      channel: `business:${pairing.businessId}`,
    };
  }

  async heartbeat(ctx: PrintAgentContext, dto: AgentRuntimeHeartbeatDto) {
    if (dto.agentId !== ctx.agentId) {
      throw new UnauthorizedException('Agent mismatch');
    }

    const agent = await this.agentRepo.findOneByOrFail({ id: ctx.agentId });
    agent.lastSeenAt = new Date();
    await this.agentRepo.save(agent);

    const settings = await this.printService.ensureSettings(ctx.businessId);
    settings.agentLastSeenAt = agent.lastSeenAt;
    await this.settingsRepo.save(settings);

    const remotePrinters = await this.syncAgentPrinters(ctx, dto.printers ?? []);
    const pendingJobs = await this.claimPendingJobs(ctx.agentId, ctx.businessId);

    return {
      agent: { id: agent.id },
      printers: remotePrinters,
      pendingJobs: pendingJobs.map((job) => ({
        id: job.id,
        printerId: job.printerId,
        payload: job.payload,
        status: job.status,
        attempts: job.attempts,
        station: job.station,
      })),
    };
  }

  async listPending(ctx: PrintAgentContext, businessId: string, agentId: string) {
    if (businessId !== ctx.businessId || agentId !== ctx.agentId) {
      throw new UnauthorizedException('Agent mismatch');
    }
    const jobs = await this.claimPendingJobs(ctx.agentId, ctx.businessId);
    return jobs.map((job) => ({
      id: job.id,
      printerId: job.printerId,
      payload: job.payload,
      status: job.status,
      attempts: job.attempts,
      station: job.station,
    }));
  }

  async ackJob(
    ctx: PrintAgentContext,
    jobId: string,
    status: 'printed' | 'failed',
    agentId: string,
    error?: string,
  ) {
    if (agentId !== ctx.agentId) {
      throw new UnauthorizedException('Agent mismatch');
    }

    const job = await this.jobRepo.findOne({
      where: { id: jobId, businessId: ctx.businessId },
    });
    if (!job) {
      throw new DomainException('Print job not found', 'PRINT_JOB_NOT_FOUND', 404);
    }

    if (status === 'printed') {
      job.status = PrintJobStatus.PRINTED;
      job.executedBy = PrintJobExecutedBy.AGENT;
      job.printedAt = new Date();
      job.errorMessage = null;
    } else {
      job.status = PrintJobStatus.FAILED;
      job.executedBy = PrintJobExecutedBy.AGENT;
      job.errorMessage = error ?? 'Print failed';
    }

    job.claimedByAgentId = null;
    job.claimedAt = null;
    await this.jobRepo.save(job);
    return { ok: true };
  }

  async listAgents(businessId: string) {
    const agents = await this.agentRepo.find({
      where: { businessId, revokedAt: IsNull() },
      order: { lastSeenAt: 'DESC' },
    });
    const printers = await this.agentPrinterRepo.find({
      where: { businessId },
      order: { name: 'ASC' },
    });
    const printersByAgent = new Map<string, AgentPrinter[]>();
    for (const printer of printers) {
      const list = printersByAgent.get(printer.agentId) ?? [];
      list.push(printer);
      printersByAgent.set(printer.agentId, list);
    }

    const now = Date.now();
    return agents.map((agent) => ({
      id: agent.id,
      deviceName: agent.deviceName,
      platform: agent.platform,
      lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
      online: agent.lastSeenAt
        ? now - agent.lastSeenAt.getTime() < AGENT_ONLINE_MS
        : false,
      printers: (printersByAgent.get(agent.id) ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        connectionType: p.connectionType,
        address: p.address,
        paperWidth: p.paperWidth,
        isOnline: p.isOnline,
        lastSeenAt: p.lastSeenAt?.toISOString() ?? null,
      })),
    }));
  }

  private async syncAgentPrinters(
    ctx: PrintAgentContext,
    printers: Array<{
      name: string;
      connectionType: PrinterConnectionType;
      address: string;
      paperWidth: number;
      isOnline: boolean;
    }>,
  ) {
    const now = new Date();
    const synced: AgentPrinter[] = [];

    for (const item of printers) {
      const address = item.address.trim();
      if (!address) continue;

      let record = await this.agentPrinterRepo.findOne({
        where: { agentId: ctx.agentId, address },
      });
      if (!record) {
        record = this.agentPrinterRepo.create({
          businessId: ctx.businessId,
          agentId: ctx.agentId,
          address,
        });
      }

      record.name = item.name.trim() || address;
      record.connectionType = item.connectionType ?? PrinterConnectionType.NETWORK;
      record.paperWidth = item.paperWidth ?? 80;
      record.isOnline = item.isOnline ?? true;
      record.lastSeenAt = now;
      synced.push(await this.agentPrinterRepo.save(record));
    }

    return synced.map((p) => ({
      id: p.id,
      name: p.name,
      connectionType: p.connectionType,
      address: p.address,
      paperWidth: p.paperWidth,
      isOnline: p.isOnline,
    }));
  }

  private async claimPendingJobs(agentId: string, businessId: string, limit = 20) {
    const agentPrinters = await this.agentPrinterRepo.find({
      where: { agentId, businessId },
    });
    const printerIds = agentPrinters.map((p) => p.id);
    if (!printerIds.length) return [];

    const staleBefore = new Date(Date.now() - CLAIM_TTL_MS);
    const candidates = await this.jobRepo.find({
      where: {
        businessId,
        status: PrintJobStatus.PENDING,
        printerId: In(printerIds),
      },
      order: { createdAt: 'ASC' },
      take: limit,
    });

    const filtered = candidates.filter(
      (job) =>
        job.printerId &&
        printerIds.includes(job.printerId) &&
        (!job.claimedAt || job.claimedAt < staleBefore),
    );

    const claimed: PrintJob[] = [];
    const now = new Date();

    for (const job of filtered) {
      const result = await this.jobRepo
        .createQueryBuilder()
        .update(PrintJob)
        .set({
          claimedByAgentId: agentId,
          claimedAt: now,
          attempts: () => '"attempts" + 1',
        })
        .where('id = :id', { id: job.id })
        .andWhere('status = :status', { status: PrintJobStatus.PENDING })
        .andWhere('(claimed_at IS NULL OR claimed_at < :staleBefore)', { staleBefore })
        .execute();

      if (result.affected === 1) {
        const updated = await this.jobRepo.findOneBy({ id: job.id });
        if (updated) claimed.push(updated);
      }
    }

    return claimed;
  }

  private generatePairingCode() {
    const bytes = randomBytes(6);
    let code = '';
    for (let i = 0; i < 6; i += 1) {
      code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
    }
    return code;
  }
}
