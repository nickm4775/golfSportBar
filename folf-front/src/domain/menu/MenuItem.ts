export type MenuCategory =
  | 'classicos'
  | 'autorais'
  | 'petiscos'
  | 'pizzas'
  | 'burgers'
  | 'sobremesas'
  | 'refrigerantes'
  | 'aguas'
  | 'energeticos'
  | 'mocktails'
  | 'cervejas'
  | 'caipiras'
  | 'doses'
  | 'garrafas'

export interface MenuItem {
  readonly id: string
  readonly category: MenuCategory
  readonly nameKey: string
  readonly descriptionKey: string
  readonly priceBrl: number
  readonly featured: boolean
  readonly imageSrc: string
}
