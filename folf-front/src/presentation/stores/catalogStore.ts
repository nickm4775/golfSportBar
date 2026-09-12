import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type { BusinessMenu, PrepStation, ProductPayload } from '@/domain/catalog/Catalog'

interface CatalogState {
  menu: BusinessMenu | null
  loaded: boolean
  loading: boolean
  error: string | null
  load: () => Promise<void>
  createProduct: (payload: {
    name: string
    description?: string
    categoryId: string
    priceBrl: number
    imageSrc?: string
    featured?: boolean
    isAvailable?: boolean
    prepStation?: PrepStation | null
  }) => Promise<void>
  updateProduct: (productId: string, payload: ProductPayload) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  uploadProductImage: (file: File) => Promise<string>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const useCatalogStore = create<CatalogState>((set) => ({
  menu: null,
  loaded: false,
  loading: false,
  error: null,

  async load() {
    set({ loading: true, error: null })
    try {
      const menu = await services.catalog.getMenu(requireBusinessId(), true)
      set({ menu, loading: false, loaded: true })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async createProduct(payload) {
    await services.catalog.createProduct(requireBusinessId(), payload)
    await useCatalogStore.getState().load()
  },

  async updateProduct(productId, payload) {
    await services.catalog.updateProduct(requireBusinessId(), productId, payload)
    await useCatalogStore.getState().load()
  },

  async deleteProduct(productId) {
    await services.catalog.deleteProduct(requireBusinessId(), productId)
    await useCatalogStore.getState().load()
  },

  async uploadProductImage(file) {
    const result = await services.catalog.uploadProductImage(requireBusinessId(), file)
    return result.url
  },
}))
