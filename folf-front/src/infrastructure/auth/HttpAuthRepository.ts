import { apiRequest } from '@/infrastructure/http/apiClient'
import type { AuthUser, IAuthRepository, StaffAuthTokens } from '@/domain/auth/AuthSession'

export class HttpAuthRepository implements IAuthRepository {
  async login(email: string, password: string) {
    return apiRequest<StaffAuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuthRefresh: true,
    })
  }

  async refresh(refreshToken: string) {
    return apiRequest<StaffAuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuthRefresh: true,
    })
  }

  getMe() {
    return apiRequest<AuthUser>('/auth/me')
  }
}
