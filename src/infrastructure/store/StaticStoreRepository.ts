import type { IStoreRepository } from '@/domain/store/IStoreRepository'
import type { StoreLocation } from '@/domain/store/StoreLocation'
import { storeCatalog } from './storeCatalog'

export class StaticStoreRepository implements IStoreRepository {
  async getAll(): Promise<readonly StoreLocation[]> {
    return storeCatalog
  }

  async getById(id: string): Promise<StoreLocation | null> {
    return storeCatalog.find((store) => store.id === id) ?? null
  }
}
