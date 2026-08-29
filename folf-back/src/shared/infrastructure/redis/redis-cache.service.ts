import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const ANALYTICS_TTL_SECONDS = 20;

type MemoryEntry = { value: string; expiresAt: number };

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: Redis | null;
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL')?.trim();
    if (!url) {
      this.client = null;
      this.logger.warn('REDIS_URL no configurado — caché desactivada');
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    this.client.on('error', (error) => {
      this.logger.warn(`Redis: ${error.message}`);
    });
    void this.client.connect().catch((error: Error) => {
      this.logger.warn(`Redis no disponible: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (this.client) {
      try {
        const raw = await this.client.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch (error) {
        this.logger.warn(
          `GET ${key} failed: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
    return this.memoryGet<T>(key);
  }

  async setJson(key: string, value: unknown, ttlSeconds: number) {
    const payload = JSON.stringify(value);
    this.memorySet(key, payload, ttlSeconds);
    if (!this.client) return;
    try {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `SET ${key} failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  async del(key: string) {
    this.memory.delete(key);
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(
        `DEL ${key} failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  async getDashboardSummary<T>(businessId: string, period: string): Promise<T | null> {
    return this.getJson<T>(this.summaryKey(businessId, period));
  }

  async setDashboardSummary(businessId: string, period: string, value: unknown) {
    await this.setJson(this.summaryKey(businessId, period), value, ANALYTICS_TTL_SECONDS);
  }

  async invalidateAnalytics(businessId: string) {
    const prefix = `analytics:${businessId}:`;
    for (const key of [...this.memory.keys()]) {
      if (key.startsWith(prefix)) this.memory.delete(key);
    }
    if (!this.client) return;
    try {
      const keys = await this.client.keys(`${prefix}*`);
      if (keys.length > 0) await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(
        `DEL analytics cache failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  private memoryGet<T>(key: string): T | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  private memorySet(key: string, value: string, ttlSeconds: number) {
    this.memory.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private summaryKey(businessId: string, period: string) {
    return `analytics:${businessId}:${period}`;
  }
}
