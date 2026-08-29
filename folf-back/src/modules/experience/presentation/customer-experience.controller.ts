import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GsproService } from '../../gspro/application/gspro.service';
import { OrderService } from '../../order/application/order.service';
import { PublicVenueService } from '../application/experience.service';
import { RealtimeTokenService } from '../../realtime/application/realtime-token.service';
import {
  CustomerCreateOrderDto,
  CustomerCreateReservationDto,
} from './dto/experience.dto';
import { AddOrderItemDto } from '../../order/presentation/dto/order.dto';
import {
  CustomerAuthGuard,
  JwtAuthGuard,
} from '../../../shared/infrastructure/guards/auth.guards';
import { JwtPayload } from '../../../shared/domain/auth.types';
import { DomainException } from '../../../shared/domain/domain.exception';
import { RealtimeTokenDto } from '../../realtime/presentation/dto/realtime.dto';
import { SWAGGER_BEARER_AUTH } from '../../../shared/infrastructure/swagger/swagger.config';
import { ApiStandardErrors } from '../../../shared/infrastructure/swagger/swagger.decorators';

@ApiTags('me')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('me')
@UseGuards(JwtAuthGuard, CustomerAuthGuard)
export class CustomerExperienceController {
  constructor(
    private readonly gsproService: GsproService,
    private readonly orderService: OrderService,
    private readonly publicVenueService: PublicVenueService,
    private readonly realtimeTokens: RealtimeTokenService,
  ) {}

  @Get('realtime/token')
  @ApiOperation({
    summary: 'Token Centrifugo del cliente',
    description: 'JWT HMAC para websocket, scoped al canal customer:{customerId}.',
  })
  @ApiOkResponse({ type: RealtimeTokenDto })
  @ApiStandardErrors()
  getRealtimeToken(@Req() req: { user: JwtPayload }) {
    return this.realtimeTokens.issueCustomerConnectionToken(req.user);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Reservas del cliente autenticado' })
  @ApiOkResponse({ description: 'Lista de reservas' })
  @ApiStandardErrors()
  listReservations(@Req() req: { user: JwtPayload }) {
    return this.gsproService.listCustomerReservations(this.customerId(req.user));
  }

  @Get('reservations/:reservationId')
  @ApiOperation({ summary: 'Detalle de una reserva propia' })
  @ApiParam({ name: 'reservationId', format: 'uuid' })
  @ApiOkResponse({ description: 'Reserva' })
  @ApiStandardErrors()
  getReservation(
    @Req() req: { user: JwtPayload },
    @Param('reservationId') reservationId: string,
  ) {
    return this.gsproService.getCustomerReservation(this.customerId(req.user), reservationId);
  }

  @Post('venues/:businessId/reservations')
  @ApiOperation({ summary: 'Crear reserva GSPro en un local' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Reserva confirmada' })
  @ApiStandardErrors()
  async createReservation(
    @Req() req: { user: JwtPayload },
    @Param('businessId') businessId: string,
    @Body() dto: CustomerCreateReservationDto,
  ) {
    await this.publicVenueService.getVenue(businessId);
    return this.gsproService.createCustomerReservation(
      businessId,
      this.customerId(req.user),
      dto,
    );
  }

  @Post('reservations/:reservationId/cancel')
  @ApiOperation({ summary: 'Cancelar una reserva propia pendiente o confirmada' })
  @ApiParam({ name: 'reservationId', format: 'uuid' })
  @ApiOkResponse({ description: 'Reserva cancelada' })
  @ApiStandardErrors()
  cancelReservation(
    @Req() req: { user: JwtPayload },
    @Param('reservationId') reservationId: string,
  ) {
    return this.gsproService.cancelCustomerReservation(
      this.customerId(req.user),
      reservationId,
    );
  }

  @Get('orders')
  @ApiOperation({ summary: 'Pedidos del cliente autenticado' })
  @ApiOkResponse({ description: 'Lista de pedidos' })
  @ApiStandardErrors()
  listOrders(@Req() req: { user: JwtPayload }) {
    return this.orderService.findByCustomer(this.customerId(req.user));
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Detalle de un pedido propio' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiOkResponse({ description: 'Pedido' })
  @ApiStandardErrors()
  getOrder(@Req() req: { user: JwtPayload }, @Param('orderId') orderId: string) {
    return this.orderService.findOneForCustomer(this.customerId(req.user), orderId);
  }

  @Post('venues/:businessId/orders')
  @ApiOperation({ summary: 'Crear pedido a mesa' })
  @ApiParam({ name: 'businessId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Pedido creado' })
  @ApiStandardErrors()
  async createOrder(
    @Req() req: { user: JwtPayload },
    @Param('businessId') businessId: string,
    @Body() dto: CustomerCreateOrderDto,
  ) {
    await this.publicVenueService.getVenue(businessId);
    return this.orderService.createForCustomer(
      businessId,
      req.user.sub,
      this.customerId(req.user),
      dto,
    );
  }

  @Post('orders/:orderId/items')
  @ApiOperation({ summary: 'Añadir ítem a un pedido propio abierto' })
  @ApiParam({ name: 'orderId', format: 'uuid' })
  @ApiCreatedResponse({ description: 'Pedido actualizado' })
  @ApiStandardErrors()
  addItem(
    @Req() req: { user: JwtPayload },
    @Param('orderId') orderId: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return this.orderService.addItemForCustomer(this.customerId(req.user), orderId, dto);
  }

  private customerId(user: JwtPayload) {
    if (!user.customerId) {
      throw new DomainException('Customer profile is required', 'CUSTOMER_REQUIRED', 403);
    }
    return user.customerId;
  }
}
