import { apiRequest } from '@/infrastructure/http/apiClient'
import type { AddOrderItemPayload, CheckoutOrderPayload, CreateOrderPayload, IOrderRepository, Order, OrderCheckoutResult } from '@/domain/order/Order'
import type { OrderItemStatus, OrderStatus } from '@/shared/domain/enums'

export class HttpOrderRepository implements IOrderRepository {
  list(businessId: string, status?: OrderStatus) {
    const query = status ? `?status=${status}` : ''
    return apiRequest<Order[]>(`/businesses/${businessId}/orders${query}`, { businessId })
  }

  getById(businessId: string, orderId: string) {
    return apiRequest<Order>(`/businesses/${businessId}/orders/${orderId}`, { businessId })
  }

  create(businessId: string, payload: CreateOrderPayload) {
    return apiRequest<Order>(`/businesses/${businessId}/orders`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  updateStatus(businessId: string, orderId: string, status: OrderStatus) {
    return apiRequest<Order>(`/businesses/${businessId}/orders/${orderId}/status`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify({ status }),
    })
  }

  addItems(businessId: string, orderId: string, items: AddOrderItemPayload[]) {
    return apiRequest<Order>(`/businesses/${businessId}/orders/${orderId}/items/batch`, {
      method: 'POST',
      businessId,
      body: JSON.stringify({ items }),
    })
  }

  updateItemStatus(businessId: string, orderId: string, itemId: string, status: OrderItemStatus) {
    return apiRequest<Order>(`/businesses/${businessId}/orders/${orderId}/items/${itemId}/status`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify({ status }),
    })
  }

  setServiceCharge(businessId: string, orderId: string, includeServiceCharge: boolean) {
    return apiRequest<Order>(`/businesses/${businessId}/orders/${orderId}/service-charge`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify({ includeServiceCharge }),
    })
  }

  checkout(businessId: string, orderId: string, payload: CheckoutOrderPayload) {
    return apiRequest<OrderCheckoutResult>(`/businesses/${businessId}/orders/${orderId}/checkout`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  getPayment(businessId: string, orderId: string) {
    return apiRequest<OrderCheckoutResult>(`/businesses/${businessId}/orders/${orderId}/payment`, {
      businessId,
    })
  }
}
