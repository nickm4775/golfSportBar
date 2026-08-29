import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../../shared/infrastructure/database/entities/order.entity';
import { GsproSession } from '../../../shared/infrastructure/database/entities/gspro-session.entity';
import { GsproReservation } from '../../../shared/infrastructure/database/entities/gspro-reservation.entity';
import { Business } from '../../../shared/infrastructure/database/entities/business.entity';
import {
  OrderStatus,
  ReservationStatus,
  SessionStatus,
} from '../../../shared/domain/enums';
import {
  AnalyticsPeriod,
  DEFAULT_ANALYTICS_PERIOD,
  type SeriesGranularity,
} from '../domain/analytics-period';
import {
  buildSeriesBuckets,
  resolvePeriodWindow,
  revenueDeltaPct,
  type PeriodWindow,
} from '../domain/period-window';
import { RedisCacheService } from '../../../shared/infrastructure/redis/redis-cache.service';

export interface RevenueSeriesRow {
  bucket: string;
  label: string;
  revenueBrl: number;
  ordersCount: number;
}

export interface OrdersByStatusRow {
  status: OrderStatus;
  count: number;
}

export interface RecentOrderRow {
  id: string;
  tableLabel: string | null;
  status: OrderStatus;
  totalBrl: number;
  createdAt: Date;
}

export interface DashboardSummary {
  period: AnalyticsPeriod;
  timezone: string;
  granularity: SeriesGranularity;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  revenuePeriodBrl: number;
  revenuePreviousPeriodBrl: number;
  revenueDeltaPct: number;
  ordersCompleted: number;
  averageTicketBrl: number;
  reservationsInPeriod: number;
  ordersOpen: number;
  sessionsActive: number;
  revenueSeries: RevenueSeriesRow[];
  ordersByStatus: OrdersByStatusRow[];
  recentOrders: RecentOrderRow[];
}

const SERIES_FORMAT: Record<SeriesGranularity, string> = {
  hour: `YYYY-MM-DD"T"HH24":00"`,
  day: 'YYYY-MM-DD',
  week: `IYYY-"W"IW`,
  month: 'YYYY-MM',
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(GsproSession)
    private readonly sessionRepo: Repository<GsproSession>,
    @InjectRepository(GsproReservation)
    private readonly reservationRepo: Repository<GsproReservation>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @Optional() private readonly cache?: RedisCacheService,
  ) {}

  async getSummary(
    businessId: string,
    period: AnalyticsPeriod = DEFAULT_ANALYTICS_PERIOD,
  ): Promise<DashboardSummary> {
    const cached = await this.cache?.getDashboardSummary<DashboardSummary>(
      businessId,
      period,
    );
    if (cached) return cached;

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    const window = resolvePeriodWindow(period, new Date(), business.timezone);
    const summary = await this.computeSummary(businessId, window);
    await this.cache?.setDashboardSummary(businessId, period, summary);
    return summary;
  }

  private async computeSummary(
    businessId: string,
    window: PeriodWindow,
  ): Promise<DashboardSummary> {
    const buckets = buildSeriesBuckets(window);
    const trunc = window.granularity;
    const format = SERIES_FORMAT[trunc];
    const bucketExpr = `date_trunc('${trunc}', o.createdAt AT TIME ZONE :tz)`;
    const bucketLabel = `TO_CHAR(${bucketExpr}, '${format}')`;

    const [
      revenuePeriodBrl,
      revenuePreviousPeriodBrl,
      ordersOpen,
      ordersCompleted,
      sessionsActive,
      reservationsInPeriod,
      seriesRaw,
      statusCounts,
      recentOrders,
    ] = await Promise.all([
      this.sumCompletedRevenue(businessId, window.from, window.to),
      this.sumCompletedRevenue(businessId, window.previousFrom, window.previousTo),
      this.countOrders(businessId, [OrderStatus.OPEN, OrderStatus.IN_PROGRESS]),
      this.countOrders(
        businessId,
        [OrderStatus.COMPLETED],
        window.from,
        window.to,
      ),
      this.sessionRepo.count({
        where: { businessId, status: SessionStatus.ACTIVE },
      }),
      this.countReservationsInPeriod(businessId, window.from, window.to),
      this.orderRepo
        .createQueryBuilder('o')
        .select(bucketLabel, 'bucket')
        .addSelect('COALESCE(SUM(o.totalBrl), 0)', 'revenue')
        .addSelect('COUNT(*)::int', 'count')
        .where('o.businessId = :businessId', { businessId })
        .andWhere('o.status = :status', { status: OrderStatus.COMPLETED })
        .andWhere('o.createdAt >= :from', { from: window.from })
        .andWhere('o.createdAt < :to', { to: window.to })
        .setParameter('tz', window.timezone)
        .groupBy(bucketExpr)
        .addGroupBy(bucketLabel)
        .orderBy(bucketExpr, 'ASC')
        .getRawMany<{ bucket: string; revenue: string; count: string }>(),
      this.orderRepo
        .createQueryBuilder('o')
        .select('o.status', 'status')
        .addSelect('COUNT(*)::int', 'count')
        .where('o.businessId = :businessId', { businessId })
        .andWhere('o.createdAt >= :from', { from: window.from })
        .andWhere('o.createdAt < :to', { to: window.to })
        .groupBy('o.status')
        .getRawMany<{ status: OrderStatus; count: string }>(),
      this.orderRepo.find({
        where: { businessId },
        order: { createdAt: 'DESC' },
        take: 8,
        select: {
          id: true,
          tableLabel: true,
          status: true,
          totalBrl: true,
          createdAt: true,
        },
      }),
    ]);

    const seriesMap = new Map(
      seriesRaw.map((row) => [
        row.bucket,
        {
          revenueBrl: Number(row.revenue),
          ordersCount: Number(row.count),
        },
      ]),
    );

    const revenueSeries: RevenueSeriesRow[] = buckets.map((bucket) => ({
      bucket: bucket.bucket,
      label: bucket.label,
      revenueBrl: seriesMap.get(bucket.bucket)?.revenueBrl ?? 0,
      ordersCount: seriesMap.get(bucket.bucket)?.ordersCount ?? 0,
    }));

    const statusCountMap = new Map(
      statusCounts.map((row) => [row.status, Number(row.count)]),
    );
    const ordersByStatus: OrdersByStatusRow[] = Object.values(OrderStatus).map(
      (status) => ({
        status,
        count: statusCountMap.get(status) ?? 0,
      }),
    );

    const averageTicketBrl =
      ordersCompleted > 0
        ? Math.round((revenuePeriodBrl / ordersCompleted) * 100) / 100
        : 0;

    return {
      period: window.period,
      timezone: window.timezone,
      granularity: window.granularity,
      from: window.from.toISOString(),
      to: window.to.toISOString(),
      previousFrom: window.previousFrom.toISOString(),
      previousTo: window.previousTo.toISOString(),
      revenuePeriodBrl,
      revenuePreviousPeriodBrl,
      revenueDeltaPct: revenueDeltaPct(revenuePeriodBrl, revenuePreviousPeriodBrl),
      ordersCompleted,
      averageTicketBrl,
      reservationsInPeriod,
      ordersOpen,
      sessionsActive,
      revenueSeries,
      ordersByStatus,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        tableLabel: order.tableLabel,
        status: order.status,
        totalBrl: Number(order.totalBrl),
        createdAt: order.createdAt,
      })),
    };
  }

  private async sumCompletedRevenue(businessId: string, from: Date, to: Date) {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.totalBrl), 0)', 'total')
      .where('o.businessId = :businessId', { businessId })
      .andWhere('o.status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('o.createdAt >= :from', { from })
      .andWhere('o.createdAt < :to', { to })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private countOrders(
    businessId: string,
    statuses: OrderStatus[],
    from?: Date,
    to?: Date,
  ) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .where('o.businessId = :businessId', { businessId })
      .andWhere('o.status IN (:...statuses)', { statuses });

    if (from) qb.andWhere('o.createdAt >= :from', { from });
    if (to) qb.andWhere('o.createdAt < :to', { to });

    return qb.getCount();
  }

  private countReservationsInPeriod(businessId: string, from: Date, to: Date) {
    return this.reservationRepo
      .createQueryBuilder('r')
      .where('r.businessId = :businessId', { businessId })
      .andWhere('r.startAt >= :from', { from })
      .andWhere('r.startAt < :to', { to })
      .andWhere('r.status NOT IN (:...excluded)', {
        excluded: [ReservationStatus.CANCELLED, ReservationStatus.NO_SHOW],
      })
      .getCount();
  }
}
