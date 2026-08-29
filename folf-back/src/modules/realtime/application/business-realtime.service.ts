import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';
import { CentrifugoPublisher } from './centrifugo.publisher';
import type { BusinessRealtimeEvent } from '../../../shared/domain/realtime.events';

@Injectable()
export class BusinessRealtimeService {
  constructor(
    private readonly cache: RedisCacheService,
    private readonly centrifugo: CentrifugoPublisher,
  ) {}

  async notify(
    businessId: string,
    event: BusinessRealtimeEvent,
    customerId?: string | null,
  ) {
    await this.cache.invalidateAnalytics(businessId);
    await this.centrifugo.publish(`business:${businessId}`, event);
    if (customerId) {
      await this.centrifugo.publish(`customer:${customerId}`, event);
    }
  }
}
