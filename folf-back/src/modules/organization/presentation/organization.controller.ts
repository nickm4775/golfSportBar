import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationService } from '../application/organization.service';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/auth.guards';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('organizations')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('mine')
  @ApiOperation({
    summary: 'Mis organizaciones',
    description: 'Lista las organizaciones donde el usuario es owner, con sus negocios.',
  })
  @ApiOkResponse({ description: 'Organizaciones del usuario' })
  @ApiStandardErrors()
  findMine(@Req() req: { user: JwtPayload }) {
    return this.organizationService.findMine(req.user.sub);
  }
}
