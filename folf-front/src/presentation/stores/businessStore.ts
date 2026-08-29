import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type { Business, BusinessMember, CreateBusinessPayload, Role } from '@/domain/business/Business'

type BusinessWritePayload = Partial<
  Pick<Business, 'name' | 'address' | 'district' | 'postalCode' | 'city' | 'state' | 'isActive'>
>

interface BusinessState {
  businesses: Business[]
  business: Business | null
  members: BusinessMember[]
  roles: Role[]
  canCreateBusiness: boolean
  loading: boolean
  error: string | null
  loadBusinesses: () => Promise<void>
  loadBusiness: () => Promise<void>
  createBusiness: (payload: CreateBusinessPayload) => Promise<Business>
  updateBusiness: (businessId: string, payload: BusinessWritePayload) => Promise<void>
  deactivateBusiness: (businessId: string) => Promise<void>
  loadStaff: () => Promise<void>
  addMember: (payload: {
    email: string
    name?: string
    password?: string
    roleId: string
  }) => Promise<void>
  updateMember: (
    userId: string,
    payload: { roleId?: string; isActive?: boolean; name?: string },
  ) => Promise<void>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const useBusinessStore = create<BusinessState>((set) => ({
  businesses: [],
  business: null,
  members: [],
  roles: [],
  canCreateBusiness: false,
  loading: false,
  error: null,

  async loadBusinesses() {
    set({ loading: true, error: null })
    try {
      const [businesses, organizations] = await Promise.all([
        services.business.listAccessible(),
        services.business.listOrganizations().catch(() => []),
      ])
      set({
        businesses,
        canCreateBusiness: organizations.length > 0,
        loading: false,
      })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async loadBusiness() {
    set({ loading: true, error: null })
    try {
      const business = await services.business.getById(requireBusinessId())
      set({ business, loading: false })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async createBusiness(payload) {
    const business = await services.business.create(payload)
    await useAuthStore.getState().refreshUser()
    useAuthStore.getState().setActiveBusiness(business.id)
    set((state) => ({
      businesses: [business, ...state.businesses.filter((item) => item.id !== business.id)],
    }))
    return business
  },

  async updateBusiness(businessId, payload) {
    const business = await services.business.update(businessId, payload)
    if (payload.name) useAuthStore.getState().renameBusiness(businessId, payload.name)
    set((state) => ({
      business: state.business?.id === businessId ? business : state.business,
      businesses: state.businesses.map((item) => (item.id === businessId ? business : item)),
    }))
  },

  async deactivateBusiness(businessId) {
    await services.business.update(businessId, { isActive: false })
    useAuthStore.getState().removeBusiness(businessId)
    set((state) => ({
      businesses: state.businesses.filter((item) => item.id !== businessId),
      business: state.business?.id === businessId ? null : state.business,
    }))
  },

  async loadStaff() {
    set({ loading: true, error: null })
    try {
      const [members, roles] = await Promise.all([
        services.business.listMembers(requireBusinessId()),
        services.business.listRoles(),
      ])
      set({ members, roles, loading: false })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async addMember(payload) {
    await services.business.addMember(requireBusinessId(), payload)
    await useBusinessStore.getState().loadStaff()
  },

  async updateMember(userId, payload) {
    await services.business.updateMember(requireBusinessId(), userId, payload)
    await useBusinessStore.getState().loadStaff()
  },
}))
