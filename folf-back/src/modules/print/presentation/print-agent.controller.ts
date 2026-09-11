import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrintAgentService } from '../application/print-agent.service';
import {
  AckPrintJobDto,
  AgentRuntimeHeartbeatDto,
  PairAgentDto,
} from './dto/print-agent.dto';
import { PrintAgentAuthGuard } from '../infrastructure/print-agent.guard';
import type { PrintAgentRequest } from '../infrastructure/print-agent.guard';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('print-agent')
@Controller('print')
export class PrintAgentController {
  constructor(private readonly printAgentService: PrintAgentService) {}

  @Post('agents/pair')
  @ApiOperation({ summary: 'Emparejar agente de impresión con código' })
  @ApiStandardErrors()
  pair(@Body() dto: PairAgentDto) {
    return this.printAgentService.pair(dto);
  }

  @Post('agents/heartbeat')
  @ApiBearerAuth()
  @UseGuards(PrintAgentAuthGuard)
  @ApiOperation({ summary: 'Heartbeat del agente desktop' })
  @ApiStandardErrors()
  heartbeat(@Req() req: PrintAgentRequest, @Body() dto: AgentRuntimeHeartbeatDto) {
    return this.printAgentService.heartbeat(req.printAgent!, dto);
  }

  @Get('jobs/pending')
  @ApiBearerAuth()
  @UseGuards(PrintAgentAuthGuard)
  @ApiOperation({ summary: 'Jobs pendientes para el agente' })
  @ApiStandardErrors()
  pendingJobs(
    @Req() req: PrintAgentRequest,
    @Query('businessId') businessId: string,
    @Query('agentId') agentId: string,
  ) {
    return this.printAgentService.listPending(req.printAgent!, businessId, agentId);
  }

  @Post('jobs/:jobId/ack')
  @ApiBearerAuth()
  @UseGuards(PrintAgentAuthGuard)
  @ApiOperation({ summary: 'Confirmar impresión de un job' })
  @ApiStandardErrors()
  ackJob(
    @Req() req: PrintAgentRequest,
    @Param('jobId') jobId: string,
    @Body() dto: AckPrintJobDto,
  ) {
    return this.printAgentService.ackJob(
      req.printAgent!,
      jobId,
      dto.status,
      dto.agentId,
      dto.error,
    );
  }
}
