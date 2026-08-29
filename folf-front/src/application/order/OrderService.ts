import type { CheckoutOrderPayload, CreateOrderPayload, IOrderRepository, OrderCheckoutResult } from '@/domain/order/Order'
import type { OrderStatus } from '@/shared/domain/enums'

export class OrderService {
  private readonly orders: IOrderRepository

  constructor(orders: IOrderRepository) {
    this.orders = orders
  }

  list(businessId: string, status?: OrderStatus) {
    return this.orders.list(businessId, status)
  }

  getById(businessId: string, orderId: string) {
    return this.orders.getById(businessId, orderId)
  }

  create(businessId: string, payload: CreateOrderPayload) {
    return this.orders.create(businessId, payload)
  }

  updateStatus(businessId: string, orderId: string, status: OrderStatus) {
    return this.orders.updateStatus(businessId, orderId, status)
  }

  addItem(
    businessId: string,
    orderId: string,
    payload: { productId: string; quantity?: number; notes?: string },
  ) {
    return this.orders.addItem(businessId, orderId, payload)
  }

  checkout(businessId: string, orderId: string, payload: CheckoutOrderPayload) {
    return this.orders.checkout(businessId, orderId, payload)
  }

  getPayment(businessId: string, orderId: string): Promise<OrderCheckoutResult> {
    return this.orders.getPayment(businessId, orderId)
  }
}
