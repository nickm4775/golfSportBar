import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GsproBay } from '../../../shared/infrastructure/database/entities/gspro-bay.entity';
import { GsproReservation } from '../../../shared/infrastructure/database/entities/gspro-reservation.entity';
import { GsproSession } from '../../../shared/infrastructure/database/entities/gspro-session.entity';
import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { ReservationStatus, SessionStatus } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';
import { zonedDayRange } from '../../../shared/domain/zoned-day';
import {
  CheckInSessionDto,
  CreateBayDto,
  CreateReservationDto,
  CreateWalkInSessionDto,
  UpdateBayDto,
  UpdateReservationDto,
  UpdateSessionDto,
} from '../presentation/dto/gspro.dto';
import { BusinessRealtimeService } from '../../realtime/application/business-realtime.service';

const MAX_RESERVATION_MS = 6 * 60 * 60 * 1000;

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

@Injectable()
export class GsproService {
  constructor(
    @InjectRepository(GsproBay)
    private readonly bayRepo: Repository<GsproBay>,
    @InjectRepository(GsproReservation)
    private readonly reservationRepo: Repository<GsproReservation>,
    @InjectRepository(GsproSession)
    private readonly sessionRepo: Repository<GsproSession>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly dataSource: DataSource,
    @Optional() private readonly realtime?: BusinessRealtimeService,
  ) {}

  listBays(businessId: string, includeInactive = false) {
    return this.bayRepo.find({
      where: includeInactive ? { businessId } : { businessId, isActive: true },
      order: { code: 'ASC' },
    });
  }

  async getAvailability(businessId: string, date: string, timeZone: string, bayId?: string) {
    const { start, end } = zonedDayRange(date, timeZone);
    const bays = await this.listBays(businessId, false);
    const scoped = bayId ? bays.filter((bay) => bay.id === bayId) : bays;
    if (bayId && scoped.length === 0) {
      throw new NotFoundException('Bay not found');
    }

    const reservations = await this.reservationRepo
      .createQueryBuilder('reservation')
      .where('reservation.businessId = :businessId', { businessId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.CHECKED_IN,
        ],
      })
      .andWhere('reservation.startAt < :end', { end })
      .andWhere('reservation.endAt > :start', { start })
      .orderBy('reservation.startAt', 'ASC')
      .getMany();

    return {
      date,
      timezone: timeZone,
      bays: scoped.map((bay) => ({
        id: bay.id,
        code: bay.code,
        name: bay.name,
        busy: reservations
          .filter((reservation) => reservation.bayId === bay.id)
          .map((reservation) => ({
            reservationId: reservation.id,
            startAt: toIso(reservation.startAt),
            endAt: toIso(reservation.endAt),
          })),
      })),
    };
  }

  async listCustomerReservations(customerId: string) {
    const rows = await this.reservationRepo.find({
      where: { customerId },
      relations: { bay: true, business: true },
      order: { startAt: 'DESC' },
    });
    return rows.map((row) => this.presentCustomerReservation(row));
  }

  async getCustomerReservation(customerId: string, reservationId: string) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId, customerId },
      relations: { bay: true, business: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return this.presentCustomerReservation(reservation);
  }

  async createCustomerReservation(
    businessId: string,
    customerId: string,
    dto: Pick<CreateReservationDto, 'bayId' | 'startAt' | 'endAt' | 'notes'>,
  ) {
    const saved = await this.createReservation(businessId, {
      bayId: dto.bayId,
      customerId,
      startAt: dto.startAt,
      endAt: dto.endAt,
      notes: dto.notes,
      status: ReservationStatus.CONFIRMED,
    });
    return this.getCustomerReservation(customerId, saved.id);
  }

  async cancelCustomerReservation(customerId: string, reservationId: string) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId, customerId },
      relations: { bay: true, business: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new DomainException(
        'Only pending or confirmed reservations can be cancelled',
        'CANNOT_CANCEL',
        409,
      );
    }

    await this.reservationRepo.update(reservationId, {
      status: ReservationStatus.CANCELLED,
    });
    const updated = await this.reservationRepo.findOneOrFail({
      where: { id: reservationId },
      relations: { bay: true, business: true },
    });
    await this.emitChanged(updated.businessId, reservationId);
    return this.presentCustomerReservation(updated);
  }

  async reservationExists(reservationId: string) {
    const row = await this.reservationRepo.findOne({
      where: { id: reservationId },
      select: { id: true },
    });
    return Boolean(row);
  }

  private presentCustomerReservation(reservation: GsproReservation) {
    return {
      id: reservation.id,
      businessId: reservation.businessId,
      bayId: reservation.bayId,
      customerId: reservation.customerId,
      startAt: toIso(reservation.startAt),
      endAt: toIso(reservation.endAt),
      status: reservation.status,
      notes: reservation.notes,
      createdAt: toIso(reservation.createdAt),
      bay: reservation.bay
        ? { id: reservation.bay.id, code: reservation.bay.code, name: reservation.bay.name }
        : null,
      business: reservation.business
        ? {
            id: reservation.business.id,
            slug: reservation.business.slug,
            name: reservation.business.name,
            address: reservation.business.address,
            city: reservation.business.city,
          }
        : null,
    };
  }

  async createBay(businessId: string, dto: CreateBayDto) {
    const bay = await this.bayRepo.save({ businessId, code: dto.code, name: dto.name });
    await this.emitChanged(businessId, bay.id);
    return bay;
  }

  async updateBay(businessId: string, bayId: string, dto: UpdateBayDto) {
    const bay = await this.bayRepo.findOne({ where: { id: bayId, businessId } });
    if (!bay) throw new NotFoundException('Bay not found');
    await this.bayRepo.update(bay.id, dto);
    const updated = await this.bayRepo.findOneByOrFail({ id: bay.id });
    await this.emitChanged(businessId, bay.id);
    return updated;
  }

  listReservations(businessId: string) {
    return this.reservationRepo.find({
      where: { businessId },
      relations: { bay: true, session: true, customer: true },
      order: { startAt: 'ASC' },
    });
  }

  async createReservation(businessId: string, dto: CreateReservationDto) {
    await this.ensureBayBelongsToBusiness(businessId, dto.bayId);
    const customer = await this.requireCustomer(dto.customerId);
    await this.ensureNoReservationOverlap(
      dto.bayId,
      new Date(dto.startAt),
      new Date(dto.endAt),
    );

    const reservation = await this.reservationRepo.save({
      businessId,
      bayId: dto.bayId,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      startAt: new Date(dto.startAt),
      endAt: new Date(dto.endAt),
      status: dto.status ?? ReservationStatus.CONFIRMED,
      notes: dto.notes,
    });

    const saved = await this.reservationRepo.findOneOrFail({
      where: { id: reservation.id },
      relations: { bay: true, customer: true },
    });
    await this.emitChanged(businessId, saved.id);
    return saved;
  }

  async updateReservation(
    businessId: string,
    reservationId: string,
    dto: UpdateReservationDto,
  ) {
    const reservation = await this.findReservation(businessId, reservationId);
    let customerName = reservation.customerName;
    let customerPhone = reservation.customerPhone;
    let customerId = reservation.customerId;

    if (dto.customerId) {
      const customer = await this.requireCustomer(dto.customerId);
      customerId = customer.id;
      customerName = customer.fullName;
      customerPhone = customer.phone;
    }

    if (dto.startAt || dto.endAt) {
      await this.ensureNoReservationOverlap(
        reservation.bayId,
        dto.startAt ? new Date(dto.startAt) : reservation.startAt,
        dto.endAt ? new Date(dto.endAt) : reservation.endAt,
        reservationId,
      );
    }

    await this.reservationRepo.update(reservationId, {
      customerId,
      customerName,
      customerPhone,
      status: dto.status,
      notes: dto.notes,
      startAt: dto.startAt ? new Date(dto.startAt) : undefined,
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
    });

    const updated = await this.reservationRepo.findOneOrFail({
      where: { id: reservationId },
      relations: { bay: true, session: true, customer: true },
    });
    await this.emitChanged(businessId, reservationId);
    return updated;
  }

  listSessions(businessId: string, status?: SessionStatus) {
    return this.sessionRepo.find({
      where: { businessId, ...(status ? { status } : {}) },
      relations: {
        bay: true,
        reservation: true,
        openedBy: true,
        closedBy: true,
      },
      select: {
        id: true,
        businessId: true,
        bayId: true,
        reservationId: true,
        status: true,
        openedById: true,
        closedById: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        bay: true,
        reservation: true,
        openedBy: { id: true, name: true },
        closedBy: { id: true, name: true },
      },
      order: { startedAt: 'DESC' },
    });
  }

  async createWalkInSession(
    businessId: string,
    userId: string,
    dto: CreateWalkInSessionDto,
  ) {
    await this.ensureBayBelongsToBusiness(businessId, dto.bayId);
    await this.ensureBayAvailable(dto.bayId);

    const session = await this.sessionRepo.save({
      businessId,
      bayId: dto.bayId,
      status: SessionStatus.ACTIVE,
      openedById: userId,
      notes: dto.notes,
    });

    const saved = await this.sessionRepo.findOneOrFail({
      where: { id: session.id },
      relations: { bay: true, openedBy: true },
      select: {
        id: true,
        businessId: true,
        bayId: true,
        reservationId: true,
        status: true,
        openedById: true,
        closedById: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        bay: true,
        openedBy: { id: true, name: true },
      },
    });
    await this.emitChanged(businessId, saved.id, userId);
    return saved;
  }

  async checkInSession(
    businessId: string,
    userId: string,
    dto: CheckInSessionDto,
  ) {
    const reservation = await this.findReservation(businessId, dto.reservationId);

    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.CHECKED_IN
    ) {
      throw new DomainException(
        'Reservation cannot be checked in',
        'INVALID_RESERVATION_STATE',
      );
    }

    if (reservation.session) {
      throw new DomainException('Reservation already checked in', 'ALREADY_CHECKED_IN');
    }

    await this.ensureBayAvailable(reservation.bayId);

    const session = await this.dataSource.transaction(async (manager) => {
      await manager.update(GsproReservation, reservation.id, {
        status: ReservationStatus.CHECKED_IN,
      });

      const created = await manager.save(GsproSession, {
        businessId,
        bayId: reservation.bayId,
        reservationId: reservation.id,
        status: SessionStatus.ACTIVE,
        openedById: userId,
        notes: dto.notes,
      });

      return manager.findOneOrFail(GsproSession, {
        where: { id: created.id },
        relations: { bay: true, reservation: true, openedBy: true },
        select: {
          id: true,
          businessId: true,
          bayId: true,
          reservationId: true,
          status: true,
          openedById: true,
          closedById: true,
          startedAt: true,
          endedAt: true,
          durationMinutes: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          bay: true,
          reservation: true,
          openedBy: { id: true, name: true },
        },
      });
    });
    await this.emitChanged(businessId, session.id, userId);
    return session;
  }

  async updateSession(
    businessId: string,
    sessionId: string,
    userId: string,
    dto: UpdateSessionDto,
  ) {
    const session = await this.findSession(businessId, sessionId);

    if (dto.status === SessionStatus.COMPLETED) {
      const endedAt = new Date();
      const durationMinutes = Math.max(
        1,
        Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000),
      );

      await this.dataSource.transaction(async (manager) => {
        if (session.reservationId) {
          await manager.update(GsproReservation, session.reservationId, {
            status: ReservationStatus.COMPLETED,
          });
        }
        await manager.update(GsproSession, sessionId, {
          status: SessionStatus.COMPLETED,
          closedById: userId,
          endedAt,
          durationMinutes,
          notes: dto.notes ?? session.notes,
        });
      });

      const completed = await this.findSessionWithRelations(sessionId);
      await this.emitChanged(businessId, sessionId, userId);
      return completed;
    }

    if (dto.status === SessionStatus.CANCELLED) {
      const cancelled = await this.dataSource.transaction(async (manager) => {
        if (session.reservationId) {
          await manager.update(GsproReservation, session.reservationId, {
            status: ReservationStatus.CANCELLED,
          });
        }
        await manager.update(GsproSession, sessionId, {
          status: SessionStatus.CANCELLED,
          closedById: userId,
          endedAt: new Date(),
          notes: dto.notes ?? session.notes,
        });
        return this.findSessionWithRelations(sessionId);
      });
      await this.emitChanged(businessId, sessionId, userId);
      return cancelled;
    }

    await this.sessionRepo.update(sessionId, {
      status: dto.status,
      notes: dto.notes,
    });

    const updated = await this.findSessionWithRelations(sessionId);
    await this.emitChanged(businessId, sessionId, userId);
    return updated;
  }

  private async emitChanged(businessId: string, entityId: string, actorUserId?: string) {
    await this.realtime?.notify(businessId, {
      type: 'gspro.changed',
      entityId,
      actorUserId,
    });
  }

  private findSessionWithRelations(sessionId: string) {
    return this.sessionRepo.findOneOrFail({
      where: { id: sessionId },
      relations: {
        bay: true,
        reservation: true,
        openedBy: true,
        closedBy: true,
      },
      select: {
        id: true,
        businessId: true,
        bayId: true,
        reservationId: true,
        status: true,
        openedById: true,
        closedById: true,
        startedAt: true,
        endedAt: true,
        durationMinutes: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        bay: true,
        reservation: true,
        openedBy: { id: true, name: true },
        closedBy: { id: true, name: true },
      },
    });
  }

  private async requireCustomer(customerId: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId, isActive: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async findReservation(businessId: string, reservationId: string) {
    const reservation = await this.reservationRepo.findOne({
      where: { id: reservationId, businessId },
      relations: { session: true },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  private async findSession(businessId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, businessId },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  private async ensureBayBelongsToBusiness(businessId: string, bayId: string) {
    const bay = await this.bayRepo.findOne({
      where: { id: bayId, businessId, isActive: true },
    });
    if (!bay) throw new NotFoundException('Bay not found');
    return bay;
  }

  private async ensureBayAvailable(bayId: string) {
    const active = await this.sessionRepo.findOne({
      where: { bayId, status: SessionStatus.ACTIVE },
    });
    if (active) {
      throw new DomainException('Bay already has an active session', 'BAY_BUSY');
    }
  }

  private async ensureNoReservationOverlap(
    bayId: string,
    startAt: Date,
    endAt: Date,
    excludeReservationId?: string,
  ) {
    if (endAt <= startAt) {
      throw new DomainException('End time must be after start time', 'INVALID_TIME_RANGE');
    }

    if (endAt.getTime() - startAt.getTime() > MAX_RESERVATION_MS) {
      throw new DomainException(
        'Reservation cannot last more than 6 hours',
        'INVALID_DURATION',
      );
    }

    const qb = this.reservationRepo
      .createQueryBuilder('reservation')
      .where('reservation.bayId = :bayId', { bayId })
      .andWhere('reservation.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.CHECKED_IN,
        ],
      })
      .andWhere('reservation.startAt < :endAt', { endAt })
      .andWhere('reservation.endAt > :startAt', { startAt });

    if (excludeReservationId) {
      qb.andWhere('reservation.id != :excludeReservationId', { excludeReservationId });
    }

    const overlap = await qb.getOne();
    if (overlap) {
      throw new DomainException(
        'Reservation overlaps with an existing booking',
        'RESERVATION_OVERLAP',
        409,
        {
          customerName: overlap.customerName,
          bayId: overlap.bayId,
          startAt: toIso(overlap.startAt),
          endAt: toIso(overlap.endAt),
        },
      );
    }
  }
}
