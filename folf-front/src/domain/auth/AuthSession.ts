export interface BusinessClaim {
  id: string
  slug: string
  name: string
  role: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  activeBusinessId?: string
  permissions: string[]
  businesses: BusinessClaim[]
}

export interface StaffAuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<StaffAuthTokens>
  refresh(refreshToken: string): Promise<StaffAuthTokens>
  getMe(): Promise<AuthUser>
}
