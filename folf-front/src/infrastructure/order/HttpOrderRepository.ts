import { apiRequest } from '@/infrastructure/http/apiClient'
import type { CheckoutOrderPayload, CreateOrderPayload, IOrderRepository, Order, OrderCheckoutResult } from '@/domain/order/Order'
import type { OrderStatus } from '@/shared/domain/enums'

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

  addItem(
    businessId: string,
    orderId: string,
    payload: { productId: string; quantity?: number; notes?: string },
  ) {
    return apiRequest<Order>(`/businesses/${businessId}/orders/${orderId}/items`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
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
