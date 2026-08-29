import { GetAllMenu } from '@/application/menu/GetAllMenu'
import { GetFeaturedMenu } from '@/application/menu/GetFeaturedMenu'
import { GetStores } from '@/application/store/GetStores'
import { Login, GetMe, RefreshSession } from '@/application/auth/AuthUseCases'
import { GetDashboardSummary } from '@/application/analytics/GetDashboardSummary'
import { OrderService } from '@/application/order/OrderService'
import { CatalogService } from '@/application/catalog/CatalogService'
import { GsproService } from '@/application/gspro/GsproService'
import { BusinessService } from '@/application/business/BusinessService'
import { CustomerService } from '@/application/customer/CustomerService'
import { HttpCustomerRepository } from '@/infrastructure/customer/HttpCustomerRepository'
import { StaticMenuRepository } from '@/infrastructure/menu/StaticMenuRepository'
import { StaticStoreRepository } from '@/infrastructure/store/StaticStoreRepository'
import { HttpAuthRepository } from '@/infrastructure/auth/HttpAuthRepository'
import { HttpAnalyticsRepository } from '@/infrastructure/analytics/HttpAnalyticsRepository'
import { HttpOrderRepository } from '@/infrastructure/order/HttpOrderRepository'
import { HttpCatalogRepository } from '@/infrastructure/catalog/HttpCatalogRepository'
import { HttpGsproRepository } from '@/infrastructure/gspro/HttpGsproRepository'
import { PrintService } from '@/application/print/PrintService'
import { HttpPrintRepository } from '@/infrastructure/print/HttpPrintRepository'
import {
  HttpBusinessRepository,
  HttpOrganizationRepository,
  HttpRbacRepository,
} from '@/infrastructure/business/HttpBusinessRepository'

const menuRepository = new StaticMenuRepository()
const storeRepository = new StaticStoreRepository()
const authRepository = new HttpAuthRepository()
const analyticsRepository = new HttpAnalyticsRepository()
const orderRepository = new HttpOrderRepository()
const catalogRepository = new HttpCatalogRepository()
const gsproRepository = new HttpGsproRepository()
const businessRepository = new HttpBusinessRepository()
const rbacRepository = new HttpRbacRepository()
const organizationRepository = new HttpOrganizationRepository()
const customerRepository = new HttpCustomerRepository()
const printRepository = new HttpPrintRepository()

export const services = {
  getFeaturedMenu: new GetFeaturedMenu(menuRepository),
  getAllMenu: new GetAllMenu(menuRepository),
  getStores: new GetStores(storeRepository),
  login: new Login(authRepository),
  refreshSession: new RefreshSession(authRepository),
  getMe: new GetMe(authRepository),
  getDashboardSummary: new GetDashboardSummary(analyticsRepository),
  orders: new OrderService(orderRepository),
  catalog: new CatalogService(catalogRepository),
  gspro: new GsproService(gsproRepository),
  business: new BusinessService(businessRepository, rbacRepository, organizationRepository),
  customers: new CustomerService(customerRepository),
  print: new PrintService(printRepository),
} as const
