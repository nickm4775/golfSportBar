import type { StoreLocation } from './StoreLocation'

export interface IStoreRepository {
  getAll(): Promise<readonly StoreLocation[]>
  getById(id: string): Promise<StoreLocation | null>
}
