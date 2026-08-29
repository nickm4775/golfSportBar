import type { IGsproRepository } from '@/domain/gspro/Gspro'
import type { ReservationStatus, SessionStatus } from '@/shared/domain/enums'

export class GsproService {
  private readonly gspro: IGsproRepository

  constructor(gspro: IGsproRepository) {
    this.gspro = gspro
  }

  listBays(businessId: string, includeInactive = false) {
    return this.gspro.listBays(businessId, includeInactive)
  }

  createBay(businessId: string, payload: { code: string; name: string }) {
    return this.gspro.createBay(businessId, payload)
  }

  updateBay(
    businessId: string,
    bayId: string,
    payload: { code?: string; name?: string; isActive?: boolean },
  ) {
    return this.gspro.updateBay(businessId, bayId, payload)
  }

  listReservations(businessId: string) {
    return this.gspro.listReservations(businessId)
  }

  createReservation(
    businessId: string,
    payload: {
      bayId: string
      customerId: string
      startAt: string
      endAt: string
      notes?: string
    },
  ) {
    return this.gspro.createReservation(businessId, payload)
  }

  updateReservation(
    businessId: string,
    reservationId: string,
    payload: { status?: ReservationStatus; notes?: string },
  ) {
    return this.gspro.updateReservation(businessId, reservationId, payload)
  }

  listSessions(businessId: string, status?: SessionStatus) {
    return this.gspro.listSessions(businessId, status)
  }

  createWalkIn(businessId: string, payload: { bayId: string; notes?: string }) {
    return this.gspro.createWalkIn(businessId, payload)
  }

  checkIn(businessId: string, payload: { reservationId: string; notes?: string }) {
    return this.gspro.checkIn(businessId, payload)
  }

  updateSession(
    businessId: string,
    sessionId: string,
    payload: { status: SessionStatus; notes?: string },
  ) {
    return this.gspro.updateSession(businessId, sessionId, payload)
  }
}
