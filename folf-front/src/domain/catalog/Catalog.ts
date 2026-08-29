export type PrepStation = 'KITCHEN' | 'BAR'

export interface MenuCategory {
  id: string
  slug: string
  namePt: string
  sortOrder: number
  prepStation?: PrepStation
}

export interface MenuItem {
  id: string
  slug: string
  category: string
  categoryName: string
  categoryId?: string
  categoryPrepStation?: PrepStation
  prepStation?: PrepStation
  productPrepStation?: PrepStation | null
  name: string
  description: string
  priceBrl: number
  featured: boolean
  imageSrc: string
  isAvailable: boolean
  businessProductId: string
}

export interface BusinessMenu {
  categories: MenuCategory[]
  items: MenuItem[]
}

export type ProductPayload = {
  name?: string
  description?: string
  categoryId?: string
  priceBrl?: number
  imageSrc?: string
  featured?: boolean
  isAvailable?: boolean
  prepStation?: PrepStation | null
}

export interface ICatalogRepository {
  getMenu(businessId: string, includeUnavailable?: boolean): Promise<BusinessMenu>
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
  ): Promise<void>
  updateProduct(businessId: string, productId: string, payload: ProductPayload): Promise<void>
  deleteProduct(businessId: string, productId: string): Promise<void>
}
