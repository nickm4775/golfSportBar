import type { AddOrderItemPayload, CheckoutOrderPayload, CreateOrderPayload, IOrderRepository, OrderCheckoutResult } from '@/domain/order/Order'
import type { OrderItemStatus, OrderStatus } from '@/shared/domain/enums'

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

  addItems(businessId: string, orderId: string, items: AddOrderItemPayload[]) {
    return this.orders.addItems(businessId, orderId, items)
  }

  updateItemStatus(businessId: string, orderId: string, itemId: string, status: OrderItemStatus) {
    return this.orders.updateItemStatus(businessId, orderId, itemId, status)
  }

  setServiceCharge(businessId: string, orderId: string, includeServiceCharge: boolean) {
    return this.orders.setServiceCharge(businessId, orderId, includeServiceCharge)
  }

  checkout(businessId: string, orderId: string, payload: CheckoutOrderPayload) {
    return this.orders.checkout(businessId, orderId, payload)
  }

  getPayment(businessId: string, orderId: string): Promise<OrderCheckoutResult> {
    return this.orders.getPayment(businessId, orderId)
  }
}
