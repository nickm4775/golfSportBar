import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PrintService } from '../application/print.service';
import { PrintAgentService } from '../application/print-agent.service';
import {
  AgentDiscoverResultDto,
  AgentHeartbeatDto,
  AgentProbeResultDto,
  DiscoverPrintersDto,
  UpdatePrintJobDto,
  UpdatePrintSettingsDto,
  UpsertPrinterDto,
} from './dto/print.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { PrepStation, PrintJobStatus } from '../../../shared/domain/enums';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('print')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
@Controller('businesses/:businessId')
export class PrintController {
  constructor(
    private readonly printService: PrintService,
    private readonly printAgentService: PrintAgentService,
  ) {}

  @Get('settings/print')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Configuración de impresión del negocio' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Settings + impresoras' })
  @ApiStandardErrors()
  getSettings(@Param('businessId') businessId: string) {
    return this.printService.getSettings(businessId);
  }

  @Patch('settings/print')
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Actualizar modo de impresión' })
  @ApiStandardErrors()
  updateSettings(
    @Param('businessId') businessId: string,
    @Body() dto: UpdatePrintSettingsDto,
  ) {
    return this.printService.updateSettings(businessId, dto);
  }

  @Patch('settings/print/printers/:station')
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Configurar impresora de estación' })
  @ApiStandardErrors()
  upsertPrinter(
    @Param('businessId') businessId: string,
    @Param('station', new ParseEnumPipe(PrepStation)) station: PrepStation,
    @Body() dto: UpsertPrinterDto,
  ) {
    return this.printService.upsertPrinter(businessId, station, dto);
  }

  @Post('settings/print/discover')
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Buscar impresoras en la LAN (9100)' })
  @ApiStandardErrors()
  discover(@Param('businessId') businessId: string, @Body() dto: DiscoverPrintersDto) {
    return this.printService.discover(businessId, dto);
  }

  @Post('settings/print/printers/:station/probe')
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Comprobar conexión TCP de una impresora' })
  @ApiStandardErrors()
  probe(
    @Param('businessId') businessId: string,
    @Param('station', new ParseEnumPipe(PrepStation)) station: PrepStation,
  ) {
    return this.printService.probePrinter(businessId, station);
  }

  @Post('settings/print/printers/:station/test')
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Encolar ticket de prueba' })
  @ApiStandardErrors()
  test(
    @Param('businessId') businessId: string,
    @Param('station', new ParseEnumPipe(PrepStation)) station: PrepStation,
  ) {
    return this.printService.enqueueTest(businessId, station);
  }

  @Post('settings/print/agent/pairing-code')
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Generar código de empareje del agente' })
  @ApiStandardErrors()
  createPairingCode(
    @Param('businessId') businessId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.printAgentService.createPairingCode(businessId, req.user.id);
  }

  @Get('settings/print/agents')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Listar agentes emparejados y sus impresoras' })
  @ApiStandardErrors()
  listAgents(@Param('businessId') businessId: string) {
    return this.printAgentService.listAgents(businessId);
  }

  @Post('settings/print/agent/heartbeat')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Heartbeat del agente de impresión (legacy)' })
  @ApiStandardErrors()
  heartbeat(@Param('businessId') businessId: string, @Body() dto: AgentHeartbeatDto) {
    return this.printService.agentHeartbeat(businessId, dto);
  }

  @Post('settings/print/agent/discover-result')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Resultado de descubrimiento del agente' })
  @ApiStandardErrors()
  discoverResult(
    @Param('businessId') businessId: string,
    @Body() dto: AgentDiscoverResultDto,
  ) {
    return this.printService.receiveDiscoverResult(businessId, dto);
  }

  @Post('settings/print/agent/probe-result')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Resultado de probe del agente' })
  @ApiStandardErrors()
  probeResult(@Param('businessId') businessId: string, @Body() dto: AgentProbeResultDto) {
    return this.printService.receiveProbeResult(businessId, dto);
  }

  @Get('print-jobs')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Listar jobs de impresión' })
  @ApiStandardErrors()
  listJobs(
    @Param('businessId') businessId: string,
    @Query('status') status?: PrintJobStatus,
  ) {
    return this.printService.listJobs(businessId, status);
  }

  @Patch('print-jobs/:jobId')
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Actualizar estado de un print job' })
  @ApiStandardErrors()
  updateJob(
    @Param('businessId') businessId: string,
    @Param('jobId') jobId: string,
    @Body() dto: UpdatePrintJobDto,
  ) {
    return this.printService.updateJob(businessId, jobId, dto);
  }
}
