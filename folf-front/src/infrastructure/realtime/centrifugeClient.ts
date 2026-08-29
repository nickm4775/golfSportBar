import { Centrifuge, UnauthorizedError } from 'centrifuge'
import { apiRequest } from '@/infrastructure/http/apiClient'
import { useAuthStore } from '@/presentation/stores/authStore'
import { useRealtimeStore } from '@/presentation/stores/realtimeStore'
import { useDashboardStore } from '@/presentation/stores/dashboardStore'
import { useOrdersStore } from '@/presentation/stores/ordersStore'
import { useGsproStore } from '@/presentation/stores/gsproStore'
import { useCatalogStore } from '@/presentation/stores/catalogStore'

export interface BusinessRealtimeEvent {
  type: 'order.changed' | 'gspro.changed' | 'catalog.changed'
  entityId?: string
  actorUserId?: string
  status?: string
}

type RealtimeEventHandler = (event: BusinessRealtimeEvent) => void

let eventHandler: RealtimeEventHandler | null = null

export function setRealtimeEventHandler(handler: RealtimeEventHandler | null) {
  eventHandler = handler
}

function centrifugoUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/connection/websocket`
}

function isRealtimeEvent(value: unknown): value is BusinessRealtimeEvent {
  if (!value || typeof value !== 'object') return false
  const type = (value as { type?: unknown }).type
  return type === 'order.changed' || type === 'gspro.changed' || type === 'catalog.changed'
}

let client: Centrifuge | null = null
let debounceTimer: number | null = null
const pending = new Set<BusinessRealtimeEvent['type']>()

function scheduleFlush() {
  if (debounceTimer != null) window.clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    const types = [...pending]
    pending.clear()
    debounceTimer = null

    void useDashboardStore.getState().load()
    if (types.includes('order.changed')) {
      const orders = useOrdersStore.getState()
      void orders.load(orders.statusFilter)
    }
    if (types.includes('gspro.changed') && useGsproStore.getState().loaded) {
      const gspro = useGsproStore.getState()
      void gspro.loadReservations()
      void gspro.loadSessions()
    }
    if (types.includes('catalog.changed') && useCatalogStore.getState().loaded) {
      void useCatalogStore.getState().load()
    }
  }, 400)
}

export function connectRealtime() {
  const businessId = useAuthStore.getState().activeBusinessId
  if (!businessId || client) return

  const next = new Centrifuge(centrifugoUrl(), {
    getToken: async () => {
      const id = useAuthStore.getState().activeBusinessId
      if (!id) throw new UnauthorizedError('NO_BUSINESS')
      try {
        const result = await apiRequest<{ token: string }>('/realtime/token', {
          businessId: id,
        })
        return result.token
      } catch {
        throw new UnauthorizedError('TOKEN_FAILED')
      }
    },
  })

  next.on('connected', () => {
    useRealtimeStore.getState().setConnected(true)
  })
  next.on('disconnected', () => {
    useRealtimeStore.getState().setConnected(false)
  })
  next.on('publication', (ctx) => {
    if (!isRealtimeEvent(ctx.data)) return
    eventHandler?.(ctx.data)
    pending.add(ctx.data.type)
    scheduleFlush()
  })

  client = next
  next.connect()
}

export function disconnectRealtime() {
  if (debounceTimer != null) {
    window.clearTimeout(debounceTimer)
    debounceTimer = null
  }
  pending.clear()
  client?.disconnect()
  client = null
  useRealtimeStore.getState().setConnected(false)
}

export function reconnectRealtime() {
  disconnectRealtime()
  connectRealtime()
}
