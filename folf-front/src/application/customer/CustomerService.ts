import type {
  CustomerPayload,
  ICustomerRepository,
  UpdateCustomerPayload,
} from '@/domain/customer/Customer'

export class CustomerService {
  private readonly customers: ICustomerRepository

  constructor(customers: ICustomerRepository) {
    this.customers = customers
  }

  search(businessId: string, query?: string) {
    return this.customers.search(businessId, query)
  }

  getById(businessId: string, customerId: string) {
    return this.customers.getById(businessId, customerId)
  }

  create(businessId: string, payload: CustomerPayload) {
    return this.customers.create(businessId, payload)
  }

  update(businessId: string, customerId: string, payload: UpdateCustomerPayload) {
    return this.customers.update(businessId, customerId, payload)
  }
}
