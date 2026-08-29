import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AnalyticsService } from '../application/analytics.service';
import {
  AnalyticsSummaryQueryDto,
  DashboardSummaryDto,
} from './dto/analytics.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';
import { DEFAULT_ANALYTICS_PERIOD } from '../domain/analytics-period';

@ApiTags('analytics')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('businesses/:businessId/analytics')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:read')
  @ApiOperation({
    summary: 'Resumen de ganancias y operación',
    description:
      'KPIs de recaudación (pedidos COMPLETED), ocupación GSPro y serie del periodo. ' +
      'Las ventanas son de calendario en el timezone del negocio (diario, semanal, trimestral, semestral, anual).',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Resumen del dashboard', type: DashboardSummaryDto })
  @ApiStandardErrors()
  getSummary(
    @Param('businessId') businessId: string,
    @Query() query: AnalyticsSummaryQueryDto,
  ) {
    return this.analyticsService.getSummary(
      businessId,
      query.period ?? DEFAULT_ANALYTICS_PERIOD,
    );
  }
}
