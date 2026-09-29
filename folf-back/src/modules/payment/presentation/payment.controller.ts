import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentService } from '../application/payment.service';
import { CheckoutOrderDto } from './dto/payment.dto';
import {
  BusinessContextGuard,
  JwtAuthGuard,
  PermissionsGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { RequirePermissions } from '../../../shared/infrastructure/decorators/auth.decorators';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('payments')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('businesses/:businessId/orders/:orderId')
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post('checkout')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:manage')
  @ApiOperation({
    summary: 'Cobrar y cerrar pedido',
    description:
      'CASH, PIX, CREDIT_CARD y DEBIT_CARD registran el cobro por el total del pedido y lo cierran de inmediato. No hay pasarela ni vuelto.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Checkout iniciado o pedido cobrado' })
  @ApiStandardErrors()
  checkout(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
    @Body() dto: CheckoutOrderDto,
  ) {
    return this.payments.checkout(businessId, orderId, dto);
  }

  @Get('payment')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('orders:manage')
  @ApiOperation({
    summary: 'Estado del cobro actual',
    description: 'Devuelve el cobro más reciente del pedido.',
  })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({ description: 'Pago actual' })
  @ApiStandardErrors()
  getCurrent(
    @Param('businessId') businessId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.getCurrent(businessId, orderId);
  }
}
