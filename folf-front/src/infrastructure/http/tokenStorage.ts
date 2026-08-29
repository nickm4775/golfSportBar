export const ACCESS_TOKEN_KEY = 'gsb-access-token'
export const REFRESH_TOKEN_KEY = 'gsb-refresh-token'

export function readAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function writeAccessToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
    return
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function readRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function writeRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token)
    return
  }
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function writeAuthTokens(accessToken: string, refreshToken: string) {
  writeAccessToken(accessToken)
  writeRefreshToken(refreshToken)
}

export function clearAuthTokens() {
  writeAccessToken(null)
  writeRefreshToken(null)
}
