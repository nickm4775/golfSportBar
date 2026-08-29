import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../../../shared/domain/enums';
import {
  AnalyticsPeriod,
  DEFAULT_ANALYTICS_PERIOD,
  type SeriesGranularity,
} from '../../domain/analytics-period';

export class AnalyticsSummaryQueryDto {
  @ApiPropertyOptional({
    enum: AnalyticsPeriod,
    default: DEFAULT_ANALYTICS_PERIOD,
    description:
      'Ventana de calendario en el timezone del negocio: daily, weekly, quarterly, semiannual, annual.',
  })
  @IsOptional()
  @IsEnum(AnalyticsPeriod)
  period?: AnalyticsPeriod;
}

export class RevenueSeriesDto {
  @ApiProperty({ example: '2026-08-18' })
  bucket!: string;

  @ApiProperty({ example: '2026-08-18' })
  label!: string;

  @ApiProperty({ example: 420.5 })
  revenueBrl!: number;

  @ApiProperty({ example: 6 })
  ordersCount!: number;
}

export class OrdersByStatusDto {
  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ example: 4 })
  count!: number;
}

export class RecentOrderDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ example: 'Mesa 4', nullable: true })
  tableLabel!: string | null;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty({ example: 86 })
  totalBrl!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class DashboardSummaryDto {
  @ApiProperty({ enum: AnalyticsPeriod, example: AnalyticsPeriod.Weekly })
  period!: AnalyticsPeriod;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  timezone!: string;

  @ApiProperty({ example: 'day' })
  granularity!: SeriesGranularity;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty()
  previousFrom!: string;

  @ApiProperty()
  previousTo!: string;

  @ApiProperty({ example: 4820.75 })
  revenuePeriodBrl!: number;

  @ApiProperty({ example: 4100 })
  revenuePreviousPeriodBrl!: number;

  @ApiProperty({ example: 17.6 })
  revenueDeltaPct!: number;

  @ApiProperty({ example: 28 })
  ordersCompleted!: number;

  @ApiProperty({ example: 86.4 })
  averageTicketBrl!: number;

  @ApiProperty({ example: 12 })
  reservationsInPeriod!: number;

  @ApiProperty({ example: 3 })
  ordersOpen!: number;

  @ApiProperty({ example: 1 })
  sessionsActive!: number;

  @ApiProperty({ type: [RevenueSeriesDto] })
  revenueSeries!: RevenueSeriesDto[];

  @ApiProperty({ type: [OrdersByStatusDto] })
  ordersByStatus!: OrdersByStatusDto[];

  @ApiProperty({ type: [RecentOrderDto] })
  recentOrders!: RecentOrderDto[];
}
