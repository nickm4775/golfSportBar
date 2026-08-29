import type { IMenuRepository } from '@/domain/menu/IMenuRepository'
import type { MenuItem } from '@/domain/menu/MenuItem'

export class GetAllMenu {
  private readonly menuRepository: IMenuRepository

  constructor(menuRepository: IMenuRepository) {
    this.menuRepository = menuRepository
  }

  async execute(): Promise<readonly MenuItem[]> {
    return this.menuRepository.getAll()
  }
}
