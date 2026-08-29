import { apiRequest } from '@/infrastructure/http/apiClient'
import type { BusinessMenu, ICatalogRepository, ProductPayload } from '@/domain/catalog/Catalog'
import type { PrepStation } from '@/domain/catalog/Catalog'

export class HttpCatalogRepository implements ICatalogRepository {
  getMenu(businessId: string, includeUnavailable = false) {
    const query = includeUnavailable ? '?includeUnavailable=true' : ''
    return apiRequest<BusinessMenu>(`/businesses/${businessId}/menu${query}`, { businessId })
  }

  async createProduct(
    businessId: string,
    payload: {
      name: string
      description?: string
      categoryId: string
      priceBrl: number
      imageSrc?: string
      featured?: boolean
      isAvailable?: boolean
      prepStation?: PrepStation | null
    },
  ) {
    await apiRequest(`/businesses/${businessId}/products`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  async updateProduct(businessId: string, productId: string, payload: ProductPayload) {
    await apiRequest(`/businesses/${businessId}/products/${productId}`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  async deleteProduct(businessId: string, productId: string) {
    await apiRequest(`/businesses/${businessId}/products/${productId}`, {
      method: 'DELETE',
      businessId,
    })
  }
}
