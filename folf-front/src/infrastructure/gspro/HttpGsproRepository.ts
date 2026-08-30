import { apiRequest } from '@/infrastructure/http/apiClient'
import type { Bay, IGsproRepository, Reservation, Session } from '@/domain/gspro/Gspro'
import type { ReservationStatus, SessionStatus } from '@/shared/domain/enums'

export class HttpGsproRepository implements IGsproRepository {
  listBays(businessId: string, includeInactive = false) {
    const query = includeInactive ? '?includeInactive=true' : ''
    return apiRequest<Bay[]>(`/businesses/${businessId}/bays${query}`, { businessId })
  }

  createBay(businessId: string, payload: { code: string; name: string }) {
    return apiRequest<Bay>(`/businesses/${businessId}/bays`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  updateBay(
    businessId: string,
    bayId: string,
    payload: { code?: string; name?: string; isActive?: boolean },
  ) {
    return apiRequest<Bay>(`/businesses/${businessId}/bays/${bayId}`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  listReservations(businessId: string) {
    return apiRequest<Reservation[]>(`/businesses/${businessId}/reservations`, { businessId })
  }

  createReservation(
    businessId: string,
    payload: {
      bayId: string
      customerId: string
      startAt: string
      endAt: string
      companionCount: number
      notes?: string
    },
  ) {
    return apiRequest<Reservation>(`/businesses/${businessId}/reservations`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  updateReservation(
    businessId: string,
    reservationId: string,
    payload: { status?: ReservationStatus; notes?: string; companionCount?: number },
  ) {
    return apiRequest<Reservation>(
      `/businesses/${businessId}/reservations/${reservationId}`,
      {
        method: 'PATCH',
        businessId,
        body: JSON.stringify(payload),
      },
    )
  }

  listSessions(businessId: string, status?: SessionStatus) {
    const query = status ? `?status=${status}` : ''
    return apiRequest<Session[]>(`/businesses/${businessId}/sessions${query}`, { businessId })
  }

  createWalkIn(
    businessId: string,
    payload: { bayId: string; companionCount: number; notes?: string },
  ) {
    return apiRequest<Session>(`/businesses/${businessId}/sessions`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  checkIn(businessId: string, payload: { reservationId: string; notes?: string }) {
    return apiRequest<Session>(`/businesses/${businessId}/sessions/check-in`, {
      method: 'POST',
      businessId,
      body: JSON.stringify(payload),
    })
  }

  updateSession(
    businessId: string,
    sessionId: string,
    payload: { status: SessionStatus; notes?: string },
  ) {
    return apiRequest<Session>(`/businesses/${businessId}/sessions/${sessionId}`, {
      method: 'PATCH',
      businessId,
      body: JSON.stringify(payload),
    })
  }
}
