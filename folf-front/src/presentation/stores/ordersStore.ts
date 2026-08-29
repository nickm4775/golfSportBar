import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type { CheckoutOrderPayload, CreateOrderPayload, Order, OrderCheckoutResult } from '@/domain/order/Order'
import type { OrderStatus } from '@/shared/domain/enums'

interface OrdersState {
  items: Order[]
  loaded: boolean
  loading: boolean
  error: string | null
  statusFilter?: OrderStatus
  load: (status?: OrderStatus) => Promise<void>
  getById: (orderId: string) => Promise<Order>
  create: (payload: CreateOrderPayload) => Promise<Order>
  updateStatus: (orderId: string, status: OrderStatus) => Promise<void>
  addItem: (orderId: string, payload: { productId: string; quantity?: number }) => Promise<void>
  checkout: (orderId: string, payload: CheckoutOrderPayload) => Promise<OrderCheckoutResult>
  getPayment: (orderId: string) => Promise<OrderCheckoutResult>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  error: null,
  statusFilter: undefined,

  async load(status) {
    set({ loading: true, error: null, statusFilter: status })
    try {
      const items = await services.orders.list(requireBusinessId(), status)
      set({
        items: [...items].sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id),
        ),
        loading: false,
        loaded: true,
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async getById(orderId) {
    const order = await services.orders.getById(requireBusinessId(), orderId)
    set({
      items: get().items.some((item) => item.id === orderId)
        ? get().items.map((item) => (item.id === orderId ? order : item))
        : [order, ...get().items],
    })
    return order
  },

  async create(payload) {
    const order = await services.orders.create(requireBusinessId(), payload)
    set({ items: [order, ...get().items], loaded: true })
    return order
  },

  async updateStatus(orderId, status) {
    const updated = await services.orders.updateStatus(requireBusinessId(), orderId, status)
    set({
      items: get().items.map((item) => (item.id === orderId ? updated : item)),
    })
  },

  async addItem(orderId, payload) {
    const updated = await services.orders.addItem(requireBusinessId(), orderId, payload)
    set({
      items: get().items.map((item) => (item.id === orderId ? updated : item)),
    })
  },

  async checkout(orderId, payload) {
    const result = await services.orders.checkout(requireBusinessId(), orderId, payload)
    set({
      items: get().items.map((item) => (item.id === orderId ? result.order : item)),
    })
    return result
  },

  async getPayment(orderId) {
    const result = await services.orders.getPayment(requireBusinessId(), orderId)
    set({
      items: get().items.map((item) => (item.id === orderId ? result.order : item)),
    })
    return result
  },
}))
