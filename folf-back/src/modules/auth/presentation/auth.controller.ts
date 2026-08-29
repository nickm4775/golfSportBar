import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from '../application/auth.service';
import { LoginDto, RefreshStaffDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../../shared/infrastructure/guards/auth.guards';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';
import {
  AccessTokenResponseDto,
  ErrorResponseDto,
  MeResponseDto,
} from '../../../shared/infrastructure/swagger/swagger-responses.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar usuario',
    description:
      'Crea una cuenta sin organización ni negocio. Devuelve JWT (auto-login). ' +
      'Un admin debe agregarlo como miembro de un negocio para acceso operativo.',
  })
  @ApiCreatedResponse({ description: 'JWT emitido', type: AccessTokenResponseDto })
  @ApiConflictResponse({ description: 'Email ya registrado', type: ErrorResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica con email y password. Devuelve access + refresh JWT con sub, email, name, ' +
      'activeBusinessId, permissions y businesses.',
  })
  @ApiCreatedResponse({ description: 'JWT emitido', type: AccessTokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas', type: ErrorResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar JWT de staff',
    description: 'Rota el refresh token y emite un access token con permisos actualizados.',
  })
  @ApiCreatedResponse({ description: 'JWT renovado', type: AccessTokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh inválido', type: ErrorResponseDto })
  refresh(@Body() dto: RefreshStaffDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Perfil del usuario autenticado',
    description: 'Devuelve datos actualizados del usuario, negocios y permisos.',
  })
  @ApiOkResponse({ description: 'Perfil', type: MeResponseDto })
  @ApiStandardErrors()
  me(@Req() req: { user: JwtPayload }) {
    return this.authService.getMe(req.user.sub, req.user.activeBusinessId);
  }
}
