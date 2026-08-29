import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SessionStatus } from '../../../shared/domain/enums';
import { GsproService } from '../application/gspro.service';
import {
  CheckInSessionDto,
  CreateBayDto,
  CreateReservationDto,
  CreateWalkInSessionDto,
  UpdateBayDto,
  UpdateReservationDto,
  UpdateSessionDto,
} from './dto/gspro.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { AuthenticatedUser } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('gspro')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('businesses/:businessId')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class GsproController {
  constructor(private readonly gsproService: GsproService) {}

  @Get('bays')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:bays:read')
  @ApiOperation({ summary: 'Listar bays del simulador' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir bays desactivados (panel de gestión).',
  })
  @ApiOkResponse({ description: 'Bays del negocio' })
  @ApiStandardErrors()
  listBays(
    @Param('businessId') businessId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.gsproService.listBays(
      businessId,
      includeInactive === 'true' || includeInactive === '1',
    );
  }

  @Post('bays')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:bays:write')
  @ApiOperation({ summary: 'Crear bay' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Bay creado' })
  @ApiStandardErrors()
  createBay(@Param('businessId') businessId: string, @Body() dto: CreateBayDto) {
    return this.gsproService.createBay(businessId, dto);
  }

  @Patch('bays/:bayId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:bays:write')
  @ApiOperation({ summary: 'Actualizar bay' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'bayId', format: 'uuid' })
  @ApiOkResponse({ description: 'Bay actualizado' })
  @ApiStandardErrors()
  updateBay(
    @Param('businessId') businessId: string,
    @Param('bayId') bayId: string,
    @Body() dto: UpdateBayDto,
  ) {
    return this.gsproService.updateBay(businessId, bayId, dto);
  }

  @Get('reservations')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:reservations:read')
  @ApiOperation({ summary: 'Listar reservas GSPro' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Reservas con bay y sesión' })
  @ApiStandardErrors()
  listReservations(@Param('businessId') businessId: string) {
    return this.gsproService.listReservations(businessId);
  }

  @Post('reservations')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:reservations:write')
  @ApiOperation({
    summary: 'Crear reserva',
    description: 'Valida que no haya solapamiento de horarios en el mismo bay.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Reserva creada' })
  @ApiStandardErrors()
  createReservation(
    @Param('businessId') businessId: string,
    @Body() dto: CreateReservationDto,
  ) {
    return this.gsproService.createReservation(businessId, dto);
  }

  @Patch('reservations/:reservationId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:reservations:write')
  @ApiOperation({ summary: 'Actualizar reserva' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'reservationId', format: 'uuid' })
  @ApiOkResponse({ description: 'Reserva actualizada' })
  @ApiStandardErrors()
  updateReservation(
    @Param('businessId') businessId: string,
    @Param('reservationId') reservationId: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.gsproService.updateReservation(businessId, reservationId, dto);
  }

  @Get('sessions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:sessions:read')
  @ApiOperation({ summary: 'Listar sesiones GSPro' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: SessionStatus })
  @ApiOkResponse({ description: 'Sesiones con bay y staff' })
  @ApiStandardErrors()
  listSessions(
    @Param('businessId') businessId: string,
    @Query('status') status?: SessionStatus,
  ) {
    return this.gsproService.listSessions(businessId, status);
  }

  @Post('sessions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:sessions:manage')
  @ApiOperation({
    summary: 'Sesión walk-in',
    description: 'Abre sesión ACTIVE directamente sin reserva previa.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Sesión iniciada' })
  @ApiStandardErrors()
  createWalkIn(
    @Param('businessId') businessId: string,
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateWalkInSessionDto,
  ) {
    return this.gsproService.createWalkInSession(businessId, req.user.id, dto);
  }

  @Post('sessions/check-in')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:sessions:manage')
  @ApiOperation({
    summary: 'Check-in de reserva',
    description: 'Marca la reserva como CHECKED_IN y abre sesión ACTIVE en el bay.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Sesión creada desde reserva' })
  @ApiStandardErrors()
  checkIn(
    @Param('businessId') businessId: string,
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CheckInSessionDto,
  ) {
    return this.gsproService.checkInSession(businessId, req.user.id, dto);
  }

  @Patch('sessions/:sessionId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('gspro:sessions:manage')
  @ApiOperation({
    summary: 'Actualizar sesión',
    description: 'Completar (COMPLETED) o cancelar (CANCELLED) una sesión activa.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiOkResponse({ description: 'Sesión actualizada' })
  @ApiStandardErrors()
  updateSession(
    @Param('businessId') businessId: string,
    @Param('sessionId') sessionId: string,
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: UpdateSessionDto,
  ) {
    return this.gsproService.updateSession(businessId, sessionId, req.user.id, dto);
  }
}
