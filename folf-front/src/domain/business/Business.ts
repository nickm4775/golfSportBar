export interface Business {
  id: string
  slug: string
  name: string
  address: string
  district: string | null
  postalCode: string | null
  city: string
  state: string
  country: string
  timezone: string
  isActive: boolean
}

export interface BusinessMember {
  id: string
  businessId: string
  userId: string
  roleId: string
  isActive: boolean
  user: {
    id: string
    email: string
    name: string
    isActive: boolean
  }
  role: {
    id: string
    name: string
  }
}

export interface Role {
  id: string
  name: string
  description: string | null
}

export interface Organization {
  id: string
  name: string
}

export type CreateBusinessPayload = {
  slug: string
  name: string
  address: string
  district?: string
  postalCode?: string
  city: string
  state: string
}

export interface IOrganizationRepository {
  listMine(): Promise<Organization[]>
}

export interface IBusinessRepository {
  listAccessible(): Promise<Business[]>
  getById(businessId: string): Promise<Business>
  create(payload: CreateBusinessPayload): Promise<Business>
  update(
    businessId: string,
    payload: Partial<
      Pick<Business, 'name' | 'address' | 'district' | 'postalCode' | 'city' | 'state' | 'isActive'>
    >,
  ): Promise<Business>
  listMembers(businessId: string): Promise<BusinessMember[]>
  addMember(
    businessId: string,
    payload: { email: string; name?: string; password?: string; roleId: string },
  ): Promise<BusinessMember>
  updateMember(
    businessId: string,
    userId: string,
    payload: { roleId?: string; isActive?: boolean; name?: string },
  ): Promise<BusinessMember>
}

export interface IRbacRepository {
  listRoles(): Promise<Role[]>
}
