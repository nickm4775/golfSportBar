import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { setUnauthorizedHandler, ApiError } from '@/infrastructure/http/apiClient'
import { readAccessToken, readRefreshToken, writeAuthTokens, clearAuthTokens } from '@/infrastructure/http/tokenStorage'
import type { AuthUser } from '@/domain/auth/AuthSession'
import { useNotificationsStore } from './notificationsStore'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  status: AuthStatus
  accessToken: string | null
  user: AuthUser | null
  activeBusinessId: string | null
  hydrate: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  setActiveBusiness: (businessId: string) => void
  renameBusiness: (businessId: string, name: string) => void
  removeBusiness: (businessId: string) => void
  hasPermission: (permission: string) => boolean
}

let unauthorizedBound = false

export const useAuthStore = create<AuthState>((set, get) => {
  if (!unauthorizedBound) {
    unauthorizedBound = true
    setUnauthorizedHandler(() => get().logout())
  }

  return {
    status: 'idle',
    accessToken: null,
    user: null,
    activeBusinessId: null,

    async hydrate() {
      const token = readAccessToken()
      const refreshToken = readRefreshToken()
      if (!token && !refreshToken) {
        useNotificationsStore.getState().reset()
        set({ status: 'anonymous', accessToken: null, user: null, activeBusinessId: null })
        return
      }

      set({ status: 'loading', accessToken: token })
      try {
        const user = await services.getMe.execute()
        set({
          status: 'authenticated',
          accessToken: readAccessToken(),
          user,
          activeBusinessId: user.activeBusinessId ?? user.businesses[0]?.id ?? null,
        })
        useNotificationsStore.getState().hydrate(user.id)
      } catch {
        clearAuthTokens()
        useNotificationsStore.getState().reset()
        set({ status: 'anonymous', accessToken: null, user: null, activeBusinessId: null })
      }
    },

    async login(email, password) {
      set({ status: 'loading' })
      try {
        const tokens = await services.login.execute(email.trim(), password)
        writeAuthTokens(tokens.accessToken, tokens.refreshToken)
        const user = await services.getMe.execute()
        set({
          status: 'authenticated',
          accessToken: tokens.accessToken,
          user,
          activeBusinessId: user.activeBusinessId ?? user.businesses[0]?.id ?? null,
        })
        useNotificationsStore.getState().hydrate(user.id)
      } catch (error) {
        clearAuthTokens()
        useNotificationsStore.getState().reset()
        set({ status: 'anonymous', accessToken: null, user: null, activeBusinessId: null })
        throw error instanceof ApiError ? error : new Error('Login failed')
      }
    },

    logout() {
      clearAuthTokens()
      useNotificationsStore.getState().reset()
      set({ status: 'anonymous', accessToken: null, user: null, activeBusinessId: null })
    },

    async refreshUser() {
      const user = await services.getMe.execute()
      const current = get().activeBusinessId
      const stillValid = current != null && user.businesses.some((business) => business.id === current)
      set({
        user,
        activeBusinessId: stillValid
          ? current
          : (user.activeBusinessId ?? user.businesses[0]?.id ?? null),
      })
    },

    setActiveBusiness(businessId) {
      set({ activeBusinessId: businessId })
    },

    renameBusiness(businessId, name) {
      const user = get().user
      if (!user) return
      set({
        user: {
          ...user,
          businesses: user.businesses.map((business) =>
            business.id === businessId ? { ...business, name } : business,
          ),
        },
      })
    },

    removeBusiness(businessId) {
      const user = get().user
      if (!user) return
      const businesses = user.businesses.filter((business) => business.id !== businessId)
      const activeBusinessId =
        get().activeBusinessId === businessId ? (businesses[0]?.id ?? null) : get().activeBusinessId
      set({ user: { ...user, businesses }, activeBusinessId })
    },

    hasPermission(permission) {
      return get().user?.permissions.includes(permission) ?? false
    },
  }
})
