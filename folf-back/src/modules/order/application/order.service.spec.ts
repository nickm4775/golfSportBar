import { DataSource, EntityManager, Repository } from 'typeorm';
import { OrderService } from './order.service';
import { Order } from '../../../shared/infrastructure/database/entities/order.entity';
import { OrderItem } from '../../../shared/infrastructure/database/entities/order-item.entity';
import { BusinessProduct } from '../../../shared/infrastructure/database/entities/business-product.entity';
import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { OrderItemStatus, OrderStatus } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';

describe('OrderService.create', () => {
  let service: OrderService;
  let orderRepo: { findOne: jest.Mock; findOneOrFail: jest.Mock; save: jest.Mock; update: jest.Mock };
  let orderItemRepo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock };
  let businessProductRepo: { findOne: jest.Mock };
  let customerRepo: { findOne: jest.Mock };
  let manager: {
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    update: jest.Mock;
    findOneOrFail: jest.Mock;
  };

  beforeEach(() => {
    orderRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    orderItemRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    businessProductRepo = { findOne: jest.fn() };
    customerRepo = { findOne: jest.fn() };
    manager = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
    };

    const dataSource = {
      transaction: jest.fn(async (cb: (em: EntityManager) => Promise<unknown>) =>
        cb(manager as unknown as EntityManager),
      ),
      manager,
    };

    service = new OrderService(
      orderRepo as unknown as Repository<Order>,
      orderItemRepo as unknown as Repository<OrderItem>,
      businessProductRepo as unknown as Repository<BusinessProduct>,
      customerRepo as unknown as Repository<Customer>,
      dataSource as unknown as DataSource,
    );
  });

  it('creates an order with several items and recalculates the total', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1', isActive: true });
    manager.save.mockImplementation(async (entity: unknown, data: Record<string, unknown>) => {
      if (entity === Order) return { id: 'order-1', ...data };
      return { id: 'item-1', ...data };
    });
    manager.findOne.mockResolvedValue({
      businessId: 'biz-1',
      productId: 'p1',
      isAvailable: true,
      priceBrl: 20,
    });
    manager.find.mockResolvedValue([
      { quantity: 2, unitPriceBrl: 20 },
      { quantity: 1, unitPriceBrl: 15 },
    ]);
    manager.findOneOrFail.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      status: OrderStatus.IN_PROGRESS,
      totalBrl: 55,
      customer: {
        id: 'cust-1',
        fullName: 'Ana Souza',
        cpf: '52998224725',
        email: 'ana@mail.com',
        phone: '5547999110011',
        birthDate: '1994-03-12',
        postalCode: null,
        street: null,
        streetNumber: null,
        complement: null,
        district: null,
        city: null,
        state: null,
        lgpdAcceptedAt: new Date(),
        userId: null,
        isActive: true,
        createdAt: new Date(),
      },
      items: [],
    });

    const result = await service.create('biz-1', 'staff-1', {
      customerId: 'cust-1',
      tableLabel: 'Mesa 1',
      items: [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ],
    });

    expect(manager.save).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({
        status: OrderStatus.IN_PROGRESS,
        customerId: 'cust-1',
      }),
    );
    expect(manager.update).toHaveBeenCalledWith(Order, 'order-1', { totalBrl: 55 });
    expect(result.totalBrl).toBe(55);
    expect(result.customer?.fullName).toBe('Ana Souza');
  });

  it('requires a table and items for customer self-service orders', async () => {
    await expect(
      service.createForCustomer('biz-1', 'user-1', 'cust-1', {
        items: [{ productId: 'p1', quantity: 1 }],
      }),
    ).rejects.toMatchObject({ code: 'TABLE_REQUIRED' });

    await expect(
      service.createForCustomer('biz-1', 'user-1', 'cust-1', {
        tableLabel: 'Mesa 4',
        items: [],
      }),
    ).rejects.toMatchObject({ code: 'ITEMS_REQUIRED' });
  });

  it('fails the whole ticket if a product is unavailable', async () => {
    customerRepo.findOne.mockResolvedValue({ id: 'cust-1', isActive: true });
    manager.save.mockResolvedValue({ id: 'order-1' });
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.create('biz-1', 'staff-1', {
        customerId: 'cust-1',
        items: [{ productId: 'missing', quantity: 1 }],
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('does not complete an order through PATCH status', async () => {
    await expect(service.updateStatus('biz-1', 'order-1', { status: OrderStatus.COMPLETED })).rejects.toMatchObject({
      code: 'PAYMENT_REQUIRED',
    });
    expect(orderRepo.update).not.toHaveBeenCalled();
  });

  it('does not auto-complete when every item is served', async () => {
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      businessId: 'biz-1',
      status: OrderStatus.IN_PROGRESS,
      items: [{ status: OrderItemStatus.SERVED }],
      customer: null,
      payments: [],
    });
    orderItemRepo.findOne.mockResolvedValue({
      id: 'item-1',
      orderId: 'order-1',
      status: OrderItemStatus.PREPARING,
    });

    await service.updateItemStatus('biz-1', 'order-1', 'item-1', {
      status: OrderItemStatus.SERVED,
    });

    expect(orderItemRepo.update).toHaveBeenCalledWith('item-1', {
      status: OrderItemStatus.SERVED,
    });
    expect(orderRepo.update).not.toHaveBeenCalled();
  });
});
