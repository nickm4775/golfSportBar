import type { MenuItem } from './MenuItem'

export interface IMenuRepository {
  getAll(): Promise<readonly MenuItem[]>
  getFeatured(): Promise<readonly MenuItem[]>
}
