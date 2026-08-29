export interface Customer {
  id: string
  fullName: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  postalCode: string | null
  street: string | null
  streetNumber: string | null
  complement: string | null
  district: string | null
  city: string | null
  state: string | null
  lgpdAcceptedAt: string
  hasLogin: boolean
  isActive: boolean
  createdAt: string
}

export type CustomerPayload = {
  fullName: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  lgpdAccepted: true
  postalCode?: string
  street?: string
  streetNumber?: string
  complement?: string
  district?: string
  city?: string
  state?: string
}

export type UpdateCustomerPayload = Partial<Omit<CustomerPayload, 'lgpdAccepted'>> & {
  isActive?: boolean
}

export interface ICustomerRepository {
  search(businessId: string, query?: string): Promise<Customer[]>
  getById(businessId: string, customerId: string): Promise<Customer>
  create(businessId: string, payload: CustomerPayload): Promise<Customer>
  update(businessId: string, customerId: string, payload: UpdateCustomerPayload): Promise<Customer>
}
