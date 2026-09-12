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
import { OrderStatus } from '../../../shared/domain/enums';
import { OrderService } from '../application/order.service';
import {
  AddOrderItemDto,
  CreateOrderDto,
  UpdateOrderItemDto,
  UpdateOrderItemStatusDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { AuthenticatedUser } from '../../../shared/domain/auth.types';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('orders')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('businesses/:businessId/orders')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:create')
  @ApiOperation({
    summary: 'Crear pedido',
    description: 'Crea un pedido. Si enviás items[], se guardan en la misma transacción.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Pedido creado' })
  @ApiStandardErrors()
  create(
    @Param('businessId') businessId: string,
    @Req() req: { user: AuthenticatedUser },
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(businessId, req.user.id, dto);
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Listar pedidos' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiOkResponse({ description: 'Lista de pedidos' })
  @ApiStandardErrors()
  findAll(
    @Param('businessId') businessId: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.orderService.findAll(businessId, status);
  }

  @Get(':orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:read')
  @ApiOperation({ summary: 'Detalle del pedido' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({ description: 'Pedido con ítems' })
  @ApiStandardErrors()
  findOne(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.findOne(businessId, orderId);
  }

  @Patch(':orderId/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:manage')
  @ApiOperation({
    summary: 'Cambiar estado del pedido',
    description:
      'Transiciones: DRAFT→OPEN→IN_PROGRESS→CANCELLED. COMPLETED solo vía checkout de pago.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({ description: 'Pedido actualizado' })
  @ApiStandardErrors()
  updateStatus(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(businessId, orderId, dto);
  }

  @Post(':orderId/print-receipt')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:read')
  @ApiOperation({
    summary: 'Imprimir comprobante del pedido',
    description: 'Encola la impresión del comprobante en la estación RECEIPT.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Trabajo de impresión encolado' })
  @ApiStandardErrors()
  printReceipt(@Param('businessId') businessId: string, @Param('orderId') orderId: string) {
    return this.orderService.printReceipt(businessId, orderId);
  }

  @Post(':orderId/items')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:create')
  @ApiOperation({
    summary: 'Agregar ítem al pedido',
    description: 'Usa el precio del BusinessProduct. Si el pedido está OPEN pasa a IN_PROGRESS.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Ítem agregado, total recalculado' })
  @ApiStandardErrors()
  addItem(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return this.orderService.addItem(businessId, orderId, dto);
  }

  @Patch(':orderId/items/:itemId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:create')
  @ApiOperation({
    summary: 'Actualizar cantidad o notas de un ítem',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Pedido con ítem actualizado' })
  @ApiStandardErrors()
  updateItem(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    return this.orderService.updateItem(businessId, orderId, itemId, dto);
  }

  @Patch(':orderId/items/:itemId/status')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:manage')
  @ApiOperation({
    summary: 'Cambiar estado del ítem',
    description: 'Transiciones: PENDING→PREPARING→SERVED|CANCELLED.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiParam({ name: 'itemId', format: 'uuid' })
  @ApiOkResponse({ description: 'Pedido con ítem actualizado' })
  @ApiStandardErrors()
  updateItemStatus(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemStatusDto,
  ) {
    return this.orderService.updateItemStatus(businessId, orderId, itemId, dto);
  }
}
