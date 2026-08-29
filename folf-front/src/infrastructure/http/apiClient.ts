import {
  readAccessToken,
  readRefreshToken,
  writeAuthTokens,
} from './tokenStorage'

export class ApiError extends Error {
  readonly statusCode: number
  readonly code?: string
  readonly details?: Record<string, unknown>

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let refreshInFlight: Promise<boolean> | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler
}

function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim()
  return configured && configured.length > 0 ? configured.replace(/\/$/, '') : '/api/v1'
}

function detailsFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return undefined
  const details = (body as { details?: unknown }).details
  if (!details || typeof details !== 'object' || Array.isArray(details)) return undefined
  return details as Record<string, unknown>
}

function messageFromBody(body: unknown, fallback: string) {
  if (!body || typeof body !== 'object') return fallback
  const message = (body as { message?: unknown }).message
  if (typeof message === 'string' && message.length > 0) return message
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0]
  return fallback
}

function codeFromBody(body: unknown) {
  if (!body || typeof body !== 'object') return undefined
  const code = (body as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

async function parseJson(response: Response) {
  const raw = await response.text()
  if (raw.length === 0) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return { message: raw }
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = readRefreshToken()
    if (!refreshToken) return false

    const response = await fetch(`${resolveBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const payload = await parseJson(response)
    if (!response.ok) return false

    const accessToken =
      payload && typeof payload === 'object' ? (payload as { accessToken?: unknown }).accessToken : null
    const nextRefresh =
      payload && typeof payload === 'object' ? (payload as { refreshToken?: unknown }).refreshToken : null

    if (typeof accessToken !== 'string' || typeof nextRefresh !== 'string') return false
    writeAuthTokens(accessToken, nextRefresh)
    return true
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { businessId?: string; skipAuthRefresh?: boolean } = {},
): Promise<T> {
  const { businessId, skipAuthRefresh = false, headers: initHeaders, body, ...rest } = options
  const headers = new Headers(initHeaders)
  const token = readAccessToken()

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (businessId) headers.set('x-business-id', businessId)
  if (body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...rest,
    headers,
    body,
  })

  if (response.status === 204) return undefined as T

  const payload = await parseJson(response)

  if (response.status === 401) {
    if (!skipAuthRefresh && path !== '/auth/refresh') {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return apiRequest<T>(path, { ...options, skipAuthRefresh: true })
      }
    }
    unauthorizedHandler?.()
    throw new ApiError(401, messageFromBody(payload, 'Unauthorized'), codeFromBody(payload), detailsFromBody(payload))
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      messageFromBody(payload, `Request failed (${response.status})`),
      codeFromBody(payload),
      detailsFromBody(payload),
    )
  }

  return payload as T
}
