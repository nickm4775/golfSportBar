import type { Customer } from '@/domain/customer/Customer'
import type { ReservationStatus, SessionStatus } from '@/shared/domain/enums'

export interface Bay {
  id: string
  code: string
  name: string
  isActive: boolean
}

export interface Reservation {
  id: string
  bayId: string
  customerId: string | null
  customerName: string
  customerPhone: string | null
  startAt: string
  endAt: string
  status: ReservationStatus
  notes: string | null
  bay?: Bay
  customer?: Pick<Customer, 'id' | 'fullName' | 'cpf' | 'phone'> | null
}

export interface Session {
  id: string
  bayId: string
  reservationId: string | null
  status: SessionStatus
  startedAt: string
  endedAt: string | null
  durationMinutes: number | null
  notes: string | null
  bay?: Bay
}

export interface IGsproRepository {
  listBays(businessId: string, includeInactive?: boolean): Promise<Bay[]>
  createBay(businessId: string, payload: { code: string; name: string }): Promise<Bay>
  updateBay(
    businessId: string,
    bayId: string,
    payload: { code?: string; name?: string; isActive?: boolean },
  ): Promise<Bay>
  listReservations(businessId: string): Promise<Reservation[]>
  createReservation(
    businessId: string,
    payload: {
      bayId: string
      customerId: string
      startAt: string
      endAt: string
      notes?: string
    },
  ): Promise<Reservation>
  updateReservation(
    businessId: string,
    reservationId: string,
    payload: { status?: ReservationStatus; notes?: string },
  ): Promise<Reservation>
  listSessions(businessId: string, status?: SessionStatus): Promise<Session[]>
  createWalkIn(businessId: string, payload: { bayId: string; notes?: string }): Promise<Session>
  checkIn(businessId: string, payload: { reservationId: string; notes?: string }): Promise<Session>
  updateSession(
    businessId: string,
    sessionId: string,
    payload: { status: SessionStatus; notes?: string },
  ): Promise<Session>
}
