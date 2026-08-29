import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaymentService } from './payment.service';
import { Payment } from '../../../shared/infrastructure/database/entities/payment.entity';
import { Order } from '../../../shared/infrastructure/database/entities/order.entity';
import { OrderService } from '../../order/application/order.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';

describe('PaymentService', () => {
  let payments: PaymentService;
  let paymentRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let orderRepo: { findOne: jest.Mock };
  let orders: { completeAfterPayment: jest.Mock; findOne: jest.Mock };
  const frozen = new Date('2026-08-19T14:00:00.000Z');

  const openOrder = {
    id: 'order-1',
    businessId: 'biz-1',
    status: OrderStatus.IN_PROGRESS,
    totalBrl: 50,
  } as Order;

  beforeEach(() => {
    paymentRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (row) => ({ id: 'pay-1', ...row })),
      create: jest.fn((row) => row),
      update: jest.fn(),
    };
    orderRepo = { findOne: jest.fn().mockResolvedValue(openOrder) };
    orders = {
      completeAfterPayment: jest.fn().mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.COMPLETED,
        payment: { method: PaymentMethod.CASH, status: PaymentStatus.PAID },
      }),
      findOne: jest.fn().mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.COMPLETED,
      }),
    };

    payments = new PaymentService(
      paymentRepo as unknown as Repository<Payment>,
      orderRepo as unknown as Repository<Order>,
      orders as unknown as OrderService,
      () => frozen,
    );
  });

  it('closes the order immediately on cash checkout for the full total', async () => {
    const result = await payments.checkout('biz-1', 'order-1', {
      method: PaymentMethod.CASH,
    });

    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        amountBrl: 50,
        cashReceivedBrl: 50,
        changeBrl: 0,
      }),
    );
    expect(orders.completeAfterPayment).toHaveBeenCalledWith('biz-1', 'order-1');
    expect(result.order.status).toBe(OrderStatus.COMPLETED);
  });

  it('closes the order immediately on PIX checkout', async () => {
    const result = await payments.checkout('biz-1', 'order-1', {
      method: PaymentMethod.PIX,
    });

    expect(paymentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        method: PaymentMethod.PIX,
        status: PaymentStatus.PAID,
        amountBrl: 50,
        provider: null,
      }),
    );
    expect(orders.completeAfterPayment).toHaveBeenCalledWith('biz-1', 'order-1');
    expect(result.order.status).toBe(OrderStatus.COMPLETED);
    expect(result.payment.status).toBe(PaymentStatus.PAID);
  });

  it('throws when the order is not in progress', async () => {
    orderRepo.findOne.mockResolvedValue({
      ...openOrder,
      status: OrderStatus.OPEN,
    });
    await expect(
      payments.checkout('biz-1', 'order-1', { method: PaymentMethod.PIX }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('throws when the order is missing', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await expect(
      payments.checkout('biz-1', 'order-1', {
        method: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
