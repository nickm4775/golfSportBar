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
import { CustomerService } from '../application/customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import {
  BusinessContextGuard,
  CustomerAuthGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('customers')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('customers')
export class CustomerMeController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, CustomerAuthGuard)
  @ApiOperation({ summary: 'Perfil del cliente autenticado' })
  @ApiOkResponse({ description: 'Ficha del cliente (CPF completo)' })
  @ApiStandardErrors()
  me(@Req() req: { user: JwtPayload }) {
    return this.customerService.getMe(req.user.sub);
  }
}

@ApiTags('customers')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('businesses/:businessId/customers')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customers:read')
  @ApiOperation({
    summary: 'Buscar clientes',
    description: 'Búsqueda global por nombre, CPF, teléfono o email. El CPF va enmascarado.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ description: 'Lista de clientes' })
  @ApiStandardErrors()
  search(@Query('q') q?: string) {
    return this.customerService.search(q);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customers:write')
  @ApiOperation({
    summary: 'Crear ficha de cliente',
    description: 'Alta staff sin contraseña. El cliente podrá setear login después (Flutter).',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Cliente creado' })
  @ApiStandardErrors()
  create(@Body() dto: CreateCustomerDto) {
    return this.customerService.createFromStaff(dto);
  }

  @Get(':customerId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customers:read')
  @ApiOperation({ summary: 'Detalle del cliente' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'customerId', format: 'uuid' })
  @ApiOkResponse({ description: 'Ficha con CPF completo para edición' })
  @ApiStandardErrors()
  findOne(@Param('customerId') customerId: string) {
    return this.customerService.findOne(customerId, { maskCpf: false });
  }

  @Patch(':customerId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('customers:write')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'customerId', format: 'uuid' })
  @ApiOkResponse({ description: 'Cliente actualizado' })
  @ApiStandardErrors()
  update(@Param('customerId') customerId: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(customerId, dto);
  }
}
