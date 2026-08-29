import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RbacService } from '../application/rbac.service';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/auth.guards';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('roles')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar roles',
    description: 'Devuelve todos los roles del sistema con sus permisos asociados.',
  })
  @ApiOkResponse({ description: 'Roles y permisos' })
  @ApiStandardErrors()
  findRoles() {
    return this.rbacService.findRoles();
  }
}
