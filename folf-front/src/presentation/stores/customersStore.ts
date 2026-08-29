import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type { Customer, CustomerPayload, UpdateCustomerPayload } from '@/domain/customer/Customer'

interface CustomersState {
  items: Customer[]
  loading: boolean
  error: string | null
  load: (query?: string) => Promise<void>
  search: (query: string) => Promise<Customer[]>
  create: (payload: CustomerPayload) => Promise<Customer>
  update: (customerId: string, payload: UpdateCustomerPayload) => Promise<Customer>
  getById: (customerId: string) => Promise<Customer>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  async load(query) {
    set({ loading: true, error: null })
    try {
      const items = await services.customers.search(requireBusinessId(), query)
      set({ items, loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async search(query) {
    return services.customers.search(requireBusinessId(), query)
  },

  async getById(customerId) {
    return services.customers.getById(requireBusinessId(), customerId)
  },

  async create(payload) {
    const customer = await services.customers.create(requireBusinessId(), payload)
    set({ items: [customer, ...get().items.filter((item) => item.id !== customer.id)] })
    return customer
  },

  async update(customerId, payload) {
    const customer = await services.customers.update(requireBusinessId(), customerId, payload)
    set({
      items: get().items.map((item) => (item.id === customerId ? customer : item)),
    })
    return customer
  },
}))
