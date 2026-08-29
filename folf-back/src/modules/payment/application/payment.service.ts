import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Payment } from '../../../shared/infrastructure/database/entities/payment.entity';
import { Order } from '../../../shared/infrastructure/database/entities/order.entity';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';
import { OrderService } from '../../order/application/order.service';
import type { CheckoutOrderDto } from '../presentation/dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly orders: OrderService,
    @Optional() @Inject('PAYMENT_CLOCK') private readonly clock?: () => Date,
  ) {}

  private now() {
    return this.clock?.() ?? new Date();
  }

  async checkout(businessId: string, orderId: string, dto: CheckoutOrderDto) {
    const order = await this.requireOpenOrder(businessId, orderId);
    const amountBrl = money(Number(order.totalBrl));

    return this.settle(order, amountBrl, dto.method);
  }

  async getCurrent(businessId: string, orderId: string) {
    await this.requireOrder(businessId, orderId);
    await this.expireStalePix(orderId);
    const payment = await this.latestPayment(orderId);
    if (!payment) throw new NotFoundException('Payment not found');
    return this.presentCheckout(payment);
  }

  private async settle(order: Order, amountBrl: number, method: PaymentMethod) {
    if (amountBrl <= 0) {
      throw new DomainException('Checkout requires a positive total', 'PIX_AMOUNT_INVALID');
    }

    await this.cancelPendingPix(order.id);

    const isCash = method === PaymentMethod.CASH;
    const payment = await this.paymentRepo.save(
      this.paymentRepo.create({
        businessId: order.businessId,
        orderId: order.id,
        method,
        status: PaymentStatus.PAID,
        amountBrl,
        cashReceivedBrl: isCash ? amountBrl : null,
        changeBrl: isCash ? 0 : null,
        provider: null,
        paidAt: this.now(),
      }),
    );

    const presentedOrder = await this.orders.completeAfterPayment(order.businessId, order.id);
    return { order: presentedOrder, payment: this.presentPayment(payment) };
  }

  private async cancelPendingPix(orderId: string) {
    await this.paymentRepo.update(
      { orderId, method: PaymentMethod.PIX, status: PaymentStatus.PENDING },
      { status: PaymentStatus.CANCELLED },
    );
  }

  private async expireStalePix(orderId: string) {
    await this.paymentRepo.update(
      {
        orderId,
        method: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        expiresAt: LessThan(this.now()),
      },
      { status: PaymentStatus.EXPIRED },
    );
  }

  private async requireOpenOrder(businessId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new DomainException('Order is not ready for checkout', 'ORDER_NOT_PAYABLE');
    }
    return order;
  }

  private async requireOrder(businessId: string, orderId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, businessId } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async latestPayment(orderId: string) {
    return this.paymentRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  private async presentCheckout(payment: Payment) {
    const order = await this.orders.findOne(payment.businessId, payment.orderId);
    return { order, payment: this.presentPayment(payment) };
  }

  private presentPayment(payment: Payment) {
    return {
      id: payment.id,
      method: payment.method,
      status: payment.status,
      amountBrl: payment.amountBrl,
      cashReceivedBrl: payment.cashReceivedBrl,
      changeBrl: payment.changeBrl,
      qrCode: payment.qrCode,
      expiresAt: payment.expiresAt,
      paidAt: payment.paidAt,
    };
  }
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}
