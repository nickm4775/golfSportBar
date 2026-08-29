import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RealtimeTokenService } from '../application/realtime-token.service';
import { RealtimeTokenDto } from './dto/realtime.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { CurrentUser } from '../../../shared/infrastructure/decorators/auth.decorators';
import type { AuthenticatedUser } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('realtime')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('realtime')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class RealtimeController {
  constructor(private readonly tokens: RealtimeTokenService) {}

  @Get('token')
  @ApiOperation({
    summary: 'Token de conexión Centrifugo',
    description:
      'JWT HMAC para el websocket de Centrifugo, scoped al negocio activo (header x-business-id).',
  })
  @ApiOkResponse({ type: RealtimeTokenDto })
  @ApiStandardErrors()
  getToken(@CurrentUser() user: AuthenticatedUser) {
    return this.tokens.issueConnectionToken(user);
  }
}
