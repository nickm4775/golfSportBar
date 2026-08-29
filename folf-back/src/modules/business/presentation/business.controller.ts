import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { BusinessService } from '../application/business.service';
import {
  CreateBusinessDto,
  CreateMemberDto,
  UpdateBusinessDto,
  UpdateMemberDto,
} from './dto/business.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('businesses')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard)
@Controller()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get('businesses')
  @ApiOperation({
    summary: 'Mis negocios',
    description: 'Lista los negocios donde el usuario tiene membership activo.',
  })
  @ApiOkResponse({ description: 'Negocios accesibles con rol' })
  @ApiStandardErrors()
  findAccessible(@Req() req: { user: JwtPayload }) {
    return this.businessService.findAccessible(req.user.sub);
  }

  @Post('businesses')
  @ApiOperation({
    summary: 'Crear negocio',
    description:
      'Crea un bar/tenant en la organización del owner. Clona el catálogo global de productos.',
  })
  @ApiCreatedResponse({ description: 'Negocio creado' })
  @ApiStandardErrors()
  create(@Req() req: { user: JwtPayload }, @Body() dto: CreateBusinessDto) {
    return this.businessService.create(req.user.sub, dto);
  }

  @Get('businesses/:businessId')
  @UseGuards(BusinessContextGuard, PermissionsGuard)
  @RequirePermissions('business:read')
  @ApiOperation({ summary: 'Detalle del negocio' })
  @ApiParam({ name: 'businessId', format: 'uuid', description: 'ID del negocio (tenant)' })
  @ApiOkResponse({ description: 'Datos del negocio' })
  @ApiStandardErrors()
  findOne(@Param('businessId') businessId: string) {
    return this.businessService.findOne(businessId);
  }

  @Patch('businesses/:businessId')
  @UseGuards(BusinessContextGuard, PermissionsGuard)
  @RequirePermissions('business:write')
  @ApiOperation({ summary: 'Actualizar negocio' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Negocio actualizado' })
  @ApiStandardErrors()
  update(@Param('businessId') businessId: string, @Body() dto: UpdateBusinessDto) {
    return this.businessService.update(businessId, dto);
  }

  @Get('businesses/:businessId/members')
  @UseGuards(BusinessContextGuard, PermissionsGuard)
  @RequirePermissions('members:read')
  @ApiOperation({ summary: 'Listar staff del negocio' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiOkResponse({ description: 'Miembros con rol y usuario' })
  @ApiStandardErrors()
  listMembers(@Param('businessId') businessId: string) {
    return this.businessService.listMembers(businessId);
  }

  @Post('businesses/:businessId/members')
  @UseGuards(BusinessContextGuard, PermissionsGuard)
  @RequirePermissions('members:write')
  @ApiOperation({
    summary: 'Agregar miembro',
    description: 'Asigna un usuario existente o crea uno nuevo al negocio con un rol.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Miembro agregado' })
  @ApiStandardErrors()
  addMember(@Param('businessId') businessId: string, @Body() dto: CreateMemberDto) {
    return this.businessService.addMember(businessId, dto);
  }

  @Patch('businesses/:businessId/members/:userId')
  @UseGuards(BusinessContextGuard, PermissionsGuard)
  @RequirePermissions('members:write')
  @ApiOperation({ summary: 'Actualizar miembro (rol o estado)' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'userId', format: 'uuid' })
  @ApiOkResponse({ description: 'Miembro actualizado' })
  @ApiStandardErrors()
  updateMember(
    @Param('businessId') businessId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.businessService.updateMember(businessId, userId, dto);
  }
}
