import type { ICatalogRepository, ProductPayload, PrepStation } from '@/domain/catalog/Catalog'

export class CatalogService {
  private readonly catalog: ICatalogRepository

  constructor(catalog: ICatalogRepository) {
    this.catalog = catalog
  }

  getMenu(businessId: string, includeUnavailable = true) {
    return this.catalog.getMenu(businessId, includeUnavailable)
  }

  createProduct(
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
    return this.catalog.createProduct(businessId, payload)
  }

  updateProduct(businessId: string, productId: string, payload: ProductPayload) {
    return this.catalog.updateProduct(businessId, productId, payload)
  }

  deleteProduct(businessId: string, productId: string) {
    return this.catalog.deleteProduct(businessId, productId)
  }

  uploadProductImage(businessId: string, file: File) {
    return this.catalog.uploadProductImage(businessId, file)
  }
}
