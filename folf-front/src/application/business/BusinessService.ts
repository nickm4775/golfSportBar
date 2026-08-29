import type {
  Business,
  CreateBusinessPayload,
  IBusinessRepository,
  IOrganizationRepository,
  IRbacRepository,
} from '@/domain/business/Business'

type BusinessWritePayload = Partial<
  Pick<Business, 'name' | 'address' | 'district' | 'postalCode' | 'city' | 'state' | 'isActive'>
>

export class BusinessService {
  private readonly businesses: IBusinessRepository
  private readonly rbac: IRbacRepository
  private readonly organizations: IOrganizationRepository

  constructor(
    businesses: IBusinessRepository,
    rbac: IRbacRepository,
    organizations: IOrganizationRepository,
  ) {
    this.businesses = businesses
    this.rbac = rbac
    this.organizations = organizations
  }

  listAccessible() {
    return this.businesses.listAccessible()
  }

  listOrganizations() {
    return this.organizations.listMine()
  }

  getById(businessId: string) {
    return this.businesses.getById(businessId)
  }

  create(payload: CreateBusinessPayload) {
    return this.businesses.create(payload)
  }

  update(businessId: string, payload: BusinessWritePayload) {
    return this.businesses.update(businessId, payload)
  }

  listMembers(businessId: string) {
    return this.businesses.listMembers(businessId)
  }

  addMember(
    businessId: string,
    payload: { email: string; name?: string; password?: string; roleId: string },
  ) {
    return this.businesses.addMember(businessId, payload)
  }

  updateMember(
    businessId: string,
    userId: string,
    payload: { roleId?: string; isActive?: boolean; name?: string },
  ) {
    return this.businesses.updateMember(businessId, userId, payload)
  }

  listRoles() {
    return this.rbac.listRoles()
  }
}
