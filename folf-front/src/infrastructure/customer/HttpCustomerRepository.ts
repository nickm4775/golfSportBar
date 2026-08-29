import { apiRequest } from '@/infrastructure/http/apiClient'
import type {
  Customer,
  CustomerPayload,
  ICustomerRepository,
  UpdateCustomerPayload,
} from '@/domain/customer/Customer'

export class HttpCustomerRepository implements ICustomerRepository {
  search(businessId: string, query?: string) {
    const q = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''
    return apiRequest<Customer[]>(`/businesses/${businessId}/customers${q}`, { businessId })
  }

  getById(businessId: string, customerId: string) {
    return apiRequest<Customer>(`/businesses/${businessId}/customers/${customerId}`, { businessId })
  }

  create(businessId: string, payload: CustomerPayload) {
    return apiRequest<Customer>(`/businesses/${businessId}/customers`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  update(businessId: string, customerId: string, payload: UpdateCustomerPayload) {
    return apiRequest<Customer>(`/businesses/${businessId}/customers/${customerId}`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }
}
