import { create } from 'zustand'
import type { AppNotification, NotificationVariant } from '@/domain/notifications/AppNotification'

const STORAGE_PREFIX = 'gsb-notifications:'
const MAX_ITEMS = 100

interface NotificationsState {
  userId: string | null
  items: AppNotification[]
  hydrate: (userId: string) => void
  reset: () => void
  push: (input: {
    title: string
    description?: string
    variant?: NotificationVariant
  }) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clear: () => void
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function readItems(userId: string): AppNotification[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AppNotification[]) : []
  } catch {
    return []
  }
}

function writeItems(userId: string, items: AppNotification[]) {
  window.localStorage.setItem(storageKey(userId), JSON.stringify(items.slice(0, MAX_ITEMS)))
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  userId: null,
  items: [],

  hydrate(userId) {
    set({ userId, items: readItems(userId) })
  },

  reset() {
    set({ userId: null, items: [] })
  },

  push(input) {
    const userId = get().userId
    if (!userId) return
    const next: AppNotification = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'success',
      createdAt: new Date().toISOString(),
      read: false,
    }
    const items = [next, ...get().items].slice(0, MAX_ITEMS)
    writeItems(userId, items)
    set({ items })
  },

  markRead(id) {
    const userId = get().userId
    const items = get().items.map((item) => (item.id === id ? { ...item, read: true } : item))
    if (userId) writeItems(userId, items)
    set({ items })
  },

  markAllRead() {
    const userId = get().userId
    const items = get().items.map((item) => ({ ...item, read: true }))
    if (userId) writeItems(userId, items)
    set({ items })
  },

  clear() {
    const userId = get().userId
    if (userId) writeItems(userId, [])
    set({ items: [] })
  },
}))
