import type { IMenuRepository } from '@/domain/menu/IMenuRepository'
import type { MenuItem } from '@/domain/menu/MenuItem'
import { menuCatalog } from './menuCatalog'

export class StaticMenuRepository implements IMenuRepository {
  async getAll(): Promise<readonly MenuItem[]> {
    return menuCatalog
  }

  async getFeatured(): Promise<readonly MenuItem[]> {
    return menuCatalog.filter((item) => item.featured)
  }
}
