import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { Order } from '../../../shared/infrastructure/database/entities/order.entity';
import { OrderItem } from '../../../shared/infrastructure/database/entities/order-item.entity';
import { BusinessProduct } from '../../../shared/infrastructure/database/entities/business-product.entity';
import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { OrderItemStatus, OrderStatus } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';
import { toCustomerView } from '../../customer/application/customer.mapper';
import {
  assertItemTransition,
  assertOrderTransition,
  calculateOrderTotal,
  calculateServiceCharge,
} from '../domain/order-state.machine';
import {
  AddOrderItemDto,
  CreateOrderDto,
  CreateOrderItemDto,
  UpdateOrderItemDto,
  UpdateOrderItemStatusDto,
  UpdateOrderStatusDto,
} from '../presentation/dto/order.dto';
import { BusinessRealtimeService } from '../../realtime/application/business-realtime.service';
import { PrintService } from '../../print/application/print.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(BusinessProduct)
    private readonly businessProductRepo: Repository<BusinessProduct>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
    @Optional() private readonly realtime?: BusinessRealtimeService,
    @Optional() private readonly printService?: PrintService,
  ) {}

  async create(businessId: string, userId: string, dto: CreateOrderDto) {
    if (dto.customerId) {
      const customer = await this.customerRepo.findOne({
        where: { id: dto.customerId, isActive: true },
      });
      if (!customer) throw new NotFoundException('Customer not found');
    }

    const itemIds: string[] = [];
    const created = await this.dataSource.transaction(async (manager) => {
      const hasItems = Boolean(dto.items?.length);
      const order = await manager.save(Order, {
        businessId,
        createdById: userId,
        customerId: dto.customerId ?? null,
        tableLabel: dto.tableLabel,
        notes: dto.notes,
        includeServiceCharge: Boolean(dto.includeServiceCharge),
        status: hasItems ? OrderStatus.IN_PROGRESS : OrderStatus.OPEN,
      });

      if (hasItems) {
        for (const item of dto.items ?? []) {
          const saved = await this.persistItem(manager, businessId, order.id, item);
          itemIds.push(saved.id);
        }
        await this.recalculateTotalWith(manager, order.id);
      }

      return manager.findOneOrFail(Order, {
        where: { id: order.id },
        relations: this.orderRelations(),
      });
    });

    await this.emitChanged(businessId, created.id, userId);
    if (itemIds.length) {
      await this.printService?.enqueueForOrderItems(businessId, created.id, itemIds);
    }
    return this.present(created);
  }

  async findAll(businessId: string, status?: OrderStatus) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('order.createdBy', 'createdBy')
      .leftJoinAndSelect('order.assignedTo', 'assignedTo')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.payments', 'payments')
      .where('order.businessId = :businessId', { businessId })
      .orderBy('order.createdAt', 'DESC')
      .addOrderBy('order.id', 'DESC');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    const orders = await qb.getMany();
    return orders.map((order) => this.present(order));
  }

  async findOne(businessId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
      relations: this.orderRelations(),
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.present(order);
  }

  async updateStatus(businessId: string, orderId: string, dto: UpdateOrderStatusDto) {
    if (dto.status === OrderStatus.COMPLETED) {
      throw new DomainException(
        'Complete the order through checkout after payment',
        'PAYMENT_REQUIRED',
      );
    }
    const order = await this.requireOrder(businessId, orderId);
    assertOrderTransition(order.status, dto.status);
    await this.orderRepo.update(orderId, { status: dto.status });
    const updated = await this.findOne(businessId, orderId);
    await this.emitChanged(businessId, orderId);
    return updated;
  }

  async completeAfterPayment(businessId: string, orderId: string) {
    const order = await this.requireOrder(businessId, orderId);
    if (order.status === OrderStatus.COMPLETED) {
      return this.present(order);
    }
    assertOrderTransition(order.status, OrderStatus.COMPLETED);
    await this.orderRepo.update(orderId, { status: OrderStatus.COMPLETED });
    const updated = await this.findOne(businessId, orderId);
    await this.emitChanged(businessId, orderId);
    return updated;
  }

  async addItem(businessId: string, orderId: string, dto: AddOrderItemDto) {
    const order = await this.requireOrder(businessId, orderId);
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new DomainException('Cannot modify a closed order', 'ORDER_CLOSED');
    }

    const savedItem = await this.persistItem(
      this.dataSource.manager,
      businessId,
      orderId,
      dto,
    );

    if (order.status === OrderStatus.OPEN) {
      await this.orderRepo.update(orderId, { status: OrderStatus.IN_PROGRESS });
    }

    const updated = await this.recalculateTotal(orderId);
    await this.emitChanged(businessId, orderId);
    await this.printService?.enqueueForOrderItems(businessId, orderId, [savedItem.id]);
    return updated;
  }

  async updateItem(
    businessId: string,
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemDto,
  ) {
    const order = await this.requireOrder(businessId, orderId);
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      throw new DomainException('Cannot modify a closed order', 'ORDER_CLOSED');
    }

    const item = await this.orderItemRepo.findOne({ where: { id: itemId, orderId } });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.status === OrderItemStatus.CANCELLED || item.status === OrderItemStatus.SERVED) {
      throw new DomainException('Cannot edit a closed item', 'ITEM_CLOSED');
    }

    await this.orderItemRepo.update(itemId, {
      quantity: dto.quantity ?? item.quantity,
      notes: dto.notes === undefined ? item.notes : dto.notes,
    });

    const updated = await this.recalculateTotal(orderId);
    await this.emitChanged(businessId, orderId);
    return updated;
  }

  async updateItemStatus(
    businessId: string,
    orderId: string,
    itemId: string,
    dto: UpdateOrderItemStatusDto,
  ) {
    await this.requireOrder(businessId, orderId);
    const item = await this.orderItemRepo.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) throw new NotFoundException('Order item not found');

    assertItemTransition(item.status, dto.status);

    await this.orderItemRepo.update(itemId, { status: dto.status });

    const updated = await this.findOne(businessId, orderId);
    await this.emitChanged(businessId, orderId);
    return updated;
  }

  async findByCustomer(customerId: string) {
    const orders = await this.orderRepo.find({
      where: { customerId },
      relations: this.orderRelations(),
      order: { createdAt: 'DESC' },
    });
    return orders.map((order) => this.present(order));
  }

  async findOneForCustomer(customerId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, customerId },
      relations: this.orderRelations(),
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.present(order);
  }

  async createForCustomer(
    businessId: string,
    userId: string,
    customerId: string,
    dto: CreateOrderDto,
  ) {
    const tableLabel = dto.tableLabel?.trim();
    if (!tableLabel) {
      throw new DomainException('Table is required', 'TABLE_REQUIRED');
    }
    if (!dto.items?.length) {
      throw new DomainException('At least one item is required', 'ITEMS_REQUIRED');
    }
    return this.create(businessId, userId, {
      ...dto,
      tableLabel,
      customerId,
    });
  }

  async addItemForCustomer(customerId: string, orderId: string, dto: AddOrderItemDto) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, customerId },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.addItem(order.businessId, orderId, dto);
  }

  async printReceipt(businessId: string, orderId: string) {
    if (!this.printService) {
      throw new DomainException('Print service not available', 'PRINT_UNAVAILABLE', 503);
    }
    return this.printService.enqueueReceiptForOrder(businessId, orderId);
  }

  private async emitChanged(businessId: string, entityId: string, actorUserId?: string) {
    const order = await this.orderRepo.findOne({ where: { id: entityId } });
    await this.realtime?.notify(
      businessId,
      {
        type: 'order.changed',
        entityId,
        actorUserId,
        status: order?.status,
      },
      order?.customerId,
    );
  }

  private async persistItem(
    manager: EntityManager,
    businessId: string,
    orderId: string,
    dto: CreateOrderItemDto,
  ) {
    const businessProduct = await manager.findOne(BusinessProduct, {
      where: {
        businessId,
        productId: dto.productId,
        isAvailable: true,
      },
    });

    if (!businessProduct) {
      throw new DomainException(
        'Product unavailable for this business',
        'PRODUCT_UNAVAILABLE',
        404,
      );
    }

    return manager.save(OrderItem, {
      orderId,
      productId: dto.productId,
      quantity: dto.quantity ?? 1,
      unitPriceBrl: businessProduct.priceBrl,
      notes: dto.notes,
    });
  }

  private async recalculateTotal(orderId: string) {
    const order = await this.orderRepo.findOneOrFail({ where: { id: orderId } });
    const items = await this.orderItemRepo.find({
      where: { orderId, status: Not(OrderItemStatus.CANCELLED) },
    });
    const subtotal = calculateOrderTotal(items);
    const serviceChargeBrl = calculateServiceCharge(subtotal, order.includeServiceCharge);
    await this.orderRepo.update(orderId, {
      serviceChargeBrl,
      totalBrl: subtotal + serviceChargeBrl,
    });
    return this.findOneById(orderId);
  }

  private async recalculateTotalWith(manager: EntityManager, orderId: string) {
    const order = await manager.findOneOrFail(Order, { where: { id: orderId } });
    const items = await manager.find(OrderItem, {
      where: { orderId, status: Not(OrderItemStatus.CANCELLED) },
    });
    const subtotal = calculateOrderTotal(items);
    const serviceChargeBrl = calculateServiceCharge(subtotal, order.includeServiceCharge);
    await manager.update(Order, orderId, {
      serviceChargeBrl,
      totalBrl: subtotal + serviceChargeBrl,
    });
  }

  private async findOneById(orderId: string) {
    const order = await this.orderRepo.findOneOrFail({
      where: { id: orderId },
      relations: this.orderRelations(),
    });
    return this.present(order);
  }

  private async requireOrder(businessId: string, orderId: string) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, businessId },
      relations: this.orderRelations(),
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private present(order: Order) {
    const { payments, ...rest } = order;
    const latest = [...(payments ?? [])].sort((a, b) => {
      const byDate = Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt));
      return byDate !== 0 ? byDate : b.id.localeCompare(a.id);
    })[0];

    return {
      ...rest,
      customer: order.customer
        ? toCustomerView(order.customer, { maskCpf: true })
        : null,
      payment: latest
        ? {
            id: latest.id,
            method: latest.method,
            status: latest.status,
            amountBrl: latest.amountBrl,
            cashReceivedBrl: latest.cashReceivedBrl,
            changeBrl: latest.changeBrl,
            paidAt: latest.paidAt,
            expiresAt: latest.expiresAt,
          }
        : null,
    };
  }

  private orderRelations() {
    return {
      items: { product: { category: true } },
      createdBy: true,
      assignedTo: true,
      customer: true,
      payments: true,
    } as const;
  }
}
