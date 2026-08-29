import type { Customer } from '@/domain/customer/Customer'
import type { OrderItemStatus, OrderStatus, PaymentMethod, PaymentStatus } from '@/shared/domain/enums'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  unitPriceBrl: number
  status: OrderItemStatus
  notes: string | null
  product?: {
    id: string
    namePt: string
    slug: string
  }
}

export interface Order {
  id: string
  businessId: string
  status: OrderStatus
  tableLabel: string | null
  notes: string | null
  totalBrl: number
  createdAt: string
  customerId?: string | null
  customer?: Pick<Customer, 'id' | 'fullName' | 'cpf' | 'phone'> | null
  items?: OrderItem[]
  payment?: OrderPayment | null
}

export interface OrderPayment {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  amountBrl: number
  cashReceivedBrl?: number | null
  changeBrl?: number | null
  qrCode?: string | null
  qrCodeBase64?: string | null
  expiresAt?: string | null
  paidAt?: string | null
}

export type CheckoutOrderPayload = {
  method: PaymentMethod
}

export type OrderCheckoutResult = {
  order: Order
  payment: OrderPayment
}

export type CreateOrderPayload = {
  customerId?: string
  tableLabel?: string
  notes?: string
  items?: Array<{ productId: string; quantity?: number; notes?: string }>
}

export interface IOrderRepository {
  list(businessId: string, status?: OrderStatus): Promise<Order[]>
  getById(businessId: string, orderId: string): Promise<Order>
  create(businessId: string, payload: CreateOrderPayload): Promise<Order>
  updateStatus(businessId: string, orderId: string, status: OrderStatus): Promise<Order>
  addItem(
    businessId: string,
    orderId: string,
    payload: { productId: string; quantity?: number; notes?: string },
  ): Promise<Order>
  checkout(businessId: string, orderId: string, payload: CheckoutOrderPayload): Promise<OrderCheckoutResult>
  getPayment(businessId: string, orderId: string): Promise<OrderCheckoutResult>
}
