import { GetAllMenu } from '@/application/menu/GetAllMenu'
import { GetFeaturedMenu } from '@/application/menu/GetFeaturedMenu'
import { GetStores } from '@/application/store/GetStores'
import { StaticMenuRepository } from '@/infrastructure/menu/StaticMenuRepository'
import { StaticStoreRepository } from '@/infrastructure/store/StaticStoreRepository'

const menuRepository = new StaticMenuRepository()
const storeRepository = new StaticStoreRepository()

export const services = {
  getFeaturedMenu: new GetFeaturedMenu(menuRepository),
  getAllMenu: new GetAllMenu(menuRepository),
  getStores: new GetStores(storeRepository),
} as const
