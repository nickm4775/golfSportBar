import { create } from 'zustand'
import type { MenuItem } from '@/domain/catalog/Catalog'
import type { Customer } from '@/domain/customer/Customer'

export interface PosLine {
  productId: string
  name: string
  imageSrc: string
  unitPriceBrl: number
  quantity: number
  notes: string
}

interface PosState {
  customer: Customer | null
  tableLabel: string
  notes: string
  includeServiceCharge: boolean
  lines: PosLine[]
  setCustomer: (customer: Customer | null) => void
  setTableLabel: (value: string) => void
  setNotes: (value: string) => void
  setIncludeServiceCharge: (value: boolean) => void
  addProduct: (product: MenuItem) => void
  setQuantity: (productId: string, quantity: number) => void
  setLineNotes: (productId: string, notes: string) => void
  removeLine: (productId: string) => void
  clear: () => void
  subtotal: () => number
  serviceCharge: () => number
  total: () => number
}

function roundBrl(value: number) {
  return Math.round(value * 100) / 100
}

export const usePosStore = create<PosState>((set, get) => ({
  customer: null,
  tableLabel: '',
  notes: '',
  includeServiceCharge: false,
  lines: [],

  setCustomer(customer) {
    set({ customer })
  },

  setTableLabel(tableLabel) {
    set({ tableLabel })
  },

  setNotes(notes) {
    set({ notes })
  },

  setIncludeServiceCharge(includeServiceCharge) {
    set({ includeServiceCharge })
  },

  addProduct(product) {
    const existing = get().lines.find((line) => line.productId === product.id)
    if (existing) {
      set({
        lines: get().lines.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        ),
      })
      return
    }
    set({
      lines: [
        ...get().lines,
        {
          productId: product.id,
          name: product.name,
          imageSrc: product.imageSrc,
          unitPriceBrl: product.priceBrl,
          quantity: 1,
          notes: '',
        },
      ],
    })
  },

  setQuantity(productId, quantity) {
    if (quantity < 1) {
      set({ lines: get().lines.filter((line) => line.productId !== productId) })
      return
    }
    set({
      lines: get().lines.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
    })
  },

  setLineNotes(productId, notes) {
    set({
      lines: get().lines.map((line) => (line.productId === productId ? { ...line, notes } : line)),
    })
  },

  removeLine(productId) {
    set({ lines: get().lines.filter((line) => line.productId !== productId) })
  },

  clear() {
    set({ customer: null, tableLabel: '', notes: '', includeServiceCharge: false, lines: [] })
  },

  subtotal() {
    return get().lines.reduce((sum, line) => sum + line.unitPriceBrl * line.quantity, 0)
  },

  serviceCharge() {
    if (!get().includeServiceCharge) return 0
    return roundBrl(get().subtotal() * 0.1)
  },

  total() {
    return roundBrl(get().subtotal() + get().serviceCharge())
  },
}))
