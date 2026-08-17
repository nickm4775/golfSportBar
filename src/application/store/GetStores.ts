import type { IStoreRepository } from '@/domain/store/IStoreRepository'
import type { StoreLocation } from '@/domain/store/StoreLocation'

export class GetStores {
  private readonly storeRepository: IStoreRepository

  constructor(storeRepository: IStoreRepository) {
    this.storeRepository = storeRepository
  }

  async execute(): Promise<readonly StoreLocation[]> {
    return this.storeRepository.getAll()
  }
}
