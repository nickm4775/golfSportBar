import { create } from 'zustand'
import { services } from '@/app/compositionRoot'
import { useAuthStore } from './authStore'
import type { Bay, Reservation, Session } from '@/domain/gspro/Gspro'
import type { ReservationStatus, SessionStatus } from '@/shared/domain/enums'

interface GsproState {
  bays: Bay[]
  reservations: Reservation[]
  sessions: Session[]
  loaded: boolean
  loading: boolean
  error: string | null
  loadBays: () => Promise<void>
  createBay: (payload: { code: string; name: string }) => Promise<void>
  loadReservations: () => Promise<void>
  createReservation: (payload: {
    bayId: string
    customerId: string
    startAt: string
    endAt: string
    companionCount: number
    notes?: string
  }) => Promise<void>
  updateReservation: (reservationId: string, payload: { status?: ReservationStatus }) => Promise<void>
  loadSessions: (status?: SessionStatus) => Promise<void>
  createWalkIn: (payload: { bayId: string; companionCount: number; notes?: string }) => Promise<void>
  checkIn: (payload: { reservationId: string }) => Promise<void>
  updateSession: (sessionId: string, status: SessionStatus) => Promise<void>
}

function requireBusinessId() {
  const id = useAuthStore.getState().activeBusinessId
  if (!id) throw new Error('NO_BUSINESS')
  return id
}

export const useGsproStore = create<GsproState>((set, get) => ({
  bays: [],
  reservations: [],
  sessions: [],
  loaded: false,
  loading: false,
  error: null,

  async loadBays() {
    set({ loading: true, error: null })
    try {
      const bays = await services.gspro.listBays(requireBusinessId())
      set({ bays, loading: false, loaded: true })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async createBay(payload) {
    await services.gspro.createBay(requireBusinessId(), payload)
    await get().loadBays()
  },

  async loadReservations() {
    set({ loading: true, error: null })
    try {
      const [reservations, bays] = await Promise.all([
        services.gspro.listReservations(requireBusinessId()),
        services.gspro.listBays(requireBusinessId()),
      ])
      set({ reservations, bays, loading: false, loaded: true })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async createReservation(payload) {
    await services.gspro.createReservation(requireBusinessId(), payload)
    await get().loadReservations()
  },

  async updateReservation(reservationId, payload) {
    await services.gspro.updateReservation(requireBusinessId(), reservationId, payload)
    await get().loadReservations()
  },

  async loadSessions(status) {
    set({ loading: true, error: null })
    try {
      const [sessions, bays, reservations] = await Promise.all([
        services.gspro.listSessions(requireBusinessId(), status),
        services.gspro.listBays(requireBusinessId()),
        services.gspro.listReservations(requireBusinessId()),
      ])
      set({ sessions, bays, reservations, loading: false, loaded: true })
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },

  async createWalkIn(payload) {
    await services.gspro.createWalkIn(requireBusinessId(), payload)
    await get().loadSessions()
  },

  async checkIn(payload) {
    await services.gspro.checkIn(requireBusinessId(), payload)
    await get().loadSessions()
  },

  async updateSession(sessionId, status) {
    await services.gspro.updateSession(requireBusinessId(), sessionId, { status })
    await get().loadSessions()
  },
}))
