import { apiRequest } from '@/infrastructure/http/apiClient'
import type {
  Business,
  BusinessMember,
  CreateBusinessPayload,
  IBusinessRepository,
  IOrganizationRepository,
  IRbacRepository,
  Organization,
  Role,
} from '@/domain/business/Business'

type BusinessWritePayload = Partial<
  Pick<Business, 'name' | 'address' | 'district' | 'postalCode' | 'city' | 'state' | 'isActive'>
>

export class HttpBusinessRepository implements IBusinessRepository {
  listAccessible() {
    return apiRequest<Business[]>('/businesses')
  }

  getById(businessId: string) {
    return apiRequest<Business>(`/businesses/${businessId}`, { businessId })
  }

  create(payload: CreateBusinessPayload) {
    return apiRequest<Business>('/businesses', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  update(businessId: string, payload: BusinessWritePayload) {
    return apiRequest<Business>(`/businesses/${businessId}`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  listMembers(businessId: string) {
    return apiRequest<BusinessMember[]>(`/businesses/${businessId}/members`, { businessId })
  }

  addMember(
    businessId: string,
    payload: { email: string; name?: string; password?: string; roleId: string },
  ) {
    return apiRequest<BusinessMember>(`/businesses/${businessId}/members`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  updateMember(
    businessId: string,
    userId: string,
    payload: { roleId?: string; isActive?: boolean; name?: string },
  ) {
    return apiRequest<BusinessMember>(`/businesses/${businessId}/members/${userId}`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }
}

export class HttpOrganizationRepository implements IOrganizationRepository {
  listMine() {
    return apiRequest<Organization[]>('/organizations/mine')
  }
}

export class HttpRbacRepository implements IRbacRepository {
  listRoles() {
    return apiRequest<Role[]>('/roles')
  }
}
