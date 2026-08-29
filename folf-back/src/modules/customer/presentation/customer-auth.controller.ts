import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CustomerService } from '../application/customer.service';
import { CustomerLoginDto, RegisterCustomerDto } from './dto/customer.dto';
import { RefreshCustomerDto } from '../../experience/presentation/dto/experience.dto';
import {
  CustomerAuthResponseDto,
  ErrorResponseDto,
} from '../../../shared/infrastructure/swagger/swagger-responses.dto';

@ApiTags('auth')
@Controller('auth/customers')
export class CustomerAuthController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Registrar cliente',
    description:
      'Cadastro brasileño (CPF, celular, email, nacimiento, LGPD). Si ya existe ficha walk-in con ese CPF, se vincula el login.',
  })
  @ApiCreatedResponse({ description: 'JWT de cliente emitido', type: CustomerAuthResponseDto })
  @ApiConflictResponse({ description: 'CPF o email ya registrado', type: ErrorResponseDto })
  register(@Body() dto: RegisterCustomerDto) {
    return this.customerService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login de cliente',
    description: 'Autentica con email o CPF y password. JWT con kind CUSTOMER.',
  })
  @ApiCreatedResponse({ description: 'JWT emitido', type: CustomerAuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas', type: ErrorResponseDto })
  login(@Body() dto: CustomerLoginDto) {
    return this.customerService.login(dto.identifier, dto.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar JWT de cliente',
    description: 'Rota el refresh token y emite un access token nuevo.',
  })
  @ApiCreatedResponse({ description: 'JWT renovado', type: CustomerAuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Refresh inválido', type: ErrorResponseDto })
  refresh(@Body() dto: RefreshCustomerDto) {
    return this.customerService.refresh(dto.refreshToken);
  }
}
