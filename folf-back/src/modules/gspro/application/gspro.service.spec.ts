import { DataSource, EntityManager, Repository } from 'typeorm';
import { GsproService } from './gspro.service';
import { GsproBay } from '../../../shared/infrastructure/database/entities/gspro-bay.entity';
import { GsproReservation } from '../../../shared/infrastructure/database/entities/gspro-reservation.entity';
import { GsproSession } from '../../../shared/infrastructure/database/entities/gspro-session.entity';
import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { ReservationStatus, SessionStatus } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';

describe('GsproService', () => {
  let service: GsproService;
  let bayRepo: { findOne: jest.Mock };
  let reservationRepo: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let sessionRepo: { findOne: jest.Mock; findOneOrFail: jest.Mock };
  let customerRepo: { findOne: jest.Mock };
  let manager: { update: jest.Mock };
  let overlapQuery: { where: jest.Mock; andWhere: jest.Mock; getOne: jest.Mock };

  const bay = { id: 'bay-1', businessId: 'biz-1', isActive: true } as GsproBay;
  const customer = {
    id: 'cust-1',
    fullName: 'Ana Souza',
    phone: '+5511999999999',
    isActive: true,
  } as Customer;

  beforeEach(() => {
    overlapQuery = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    bayRepo = { findOne: jest.fn().mockResolvedValue(bay) };
    reservationRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(overlapQuery),
    };
    sessionRepo = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    customerRepo = { findOne: jest.fn().mockResolvedValue(customer) };
    manager = { update: jest.fn().mockResolvedValue(undefined) };

    const dataSource = {
      transaction: jest.fn(async (cb: (em: EntityManager) => Promise<unknown>) =>
        cb(manager as unknown as EntityManager),
      ),
    };

    service = new GsproService(
      bayRepo as unknown as Repository<GsproBay>,
      reservationRepo as unknown as Repository<GsproReservation>,
      sessionRepo as unknown as Repository<GsproSession>,
      customerRepo as unknown as Repository<Customer>,
      dataSource as unknown as DataSource,
    );
  });

  describe('createReservation', () => {
    it('rejects ranges longer than 6 hours', async () => {
      await expect(
        service.createReservation('biz-1', {
          bayId: 'bay-1',
          customerId: 'cust-1',
          startAt: '2026-08-18T18:00:00.000Z',
          endAt: '2026-08-19T01:00:00.000Z',
        }),
      ).rejects.toMatchObject({ code: 'INVALID_DURATION' });
      expect(reservationRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('allows adjacent slots that do not overlap', async () => {
      reservationRepo.save.mockResolvedValue({ id: 'res-1' });
      reservationRepo.findOneOrFail.mockResolvedValue({ id: 'res-1' });

      await service.createReservation('biz-1', {
        bayId: 'bay-1',
        customerId: 'cust-1',
        startAt: '2026-08-18T21:00:00.000Z',
        endAt: '2026-08-18T22:00:00.000Z',
      });

      expect(overlapQuery.getOne).toHaveBeenCalled();
      expect(reservationRepo.save).toHaveBeenCalled();
    });

    it('returns 409 details when the bay is already booked', async () => {
      overlapQuery.getOne.mockResolvedValue({
        customerName: 'asdfghjk',
        bayId: 'bay-1',
        startAt: new Date('2026-08-18T02:58:00.000Z'),
        endAt: new Date('2026-09-04T02:58:00.000Z'),
      });

      await expect(
        service.createReservation('biz-1', {
          bayId: 'bay-1',
          customerId: 'cust-1',
          startAt: '2026-08-18T18:00:00.000Z',
          endAt: '2026-08-18T19:00:00.000Z',
        }),
      ).rejects.toEqual(
        expect.objectContaining({
          code: 'RESERVATION_OVERLAP',
          statusCode: 409,
          details: {
            customerName: 'asdfghjk',
            bayId: 'bay-1',
            startAt: '2026-08-18T02:58:00.000Z',
            endAt: '2026-09-04T02:58:00.000Z',
          },
        }),
      );
      expect(reservationRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateSession', () => {
    it('marks the linked reservation COMPLETED when the session ends', async () => {
      sessionRepo.findOne.mockResolvedValue({
        id: 'ses-1',
        businessId: 'biz-1',
        reservationId: 'res-1',
        startedAt: new Date('2026-08-18T18:00:00.000Z'),
        notes: null,
      });
      sessionRepo.findOneOrFail.mockResolvedValue({ id: 'ses-1', status: SessionStatus.COMPLETED });

      await service.updateSession('biz-1', 'ses-1', 'user-1', {
        status: SessionStatus.COMPLETED,
      });

      expect(manager.update).toHaveBeenCalledWith(GsproReservation, 'res-1', {
        status: ReservationStatus.COMPLETED,
      });
      expect(manager.update).toHaveBeenCalledWith(
        GsproSession,
        'ses-1',
        expect.objectContaining({
          status: SessionStatus.COMPLETED,
          closedById: 'user-1',
        }),
      );
    });
  });

  it('throws DomainException for invalid time range', async () => {
    await expect(
      service.createReservation('biz-1', {
        bayId: 'bay-1',
        customerId: 'cust-1',
        startAt: '2026-08-18T19:00:00.000Z',
        endAt: '2026-08-18T18:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(DomainException);
  });

  describe('cancelCustomerReservation', () => {
    it('cancels a confirmed reservation owned by the customer', async () => {
      reservationRepo.findOne.mockResolvedValue({
        id: 'res-1',
        customerId: 'cust-1',
        businessId: 'biz-1',
        status: ReservationStatus.CONFIRMED,
        startAt: new Date('2026-08-18T18:00:00.000Z'),
        endAt: new Date('2026-08-18T19:00:00.000Z'),
        createdAt: new Date('2026-08-18T10:00:00.000Z'),
        bay: { id: 'bay-1', code: 'BAY-1', name: 'Bay 1' },
        business: { id: 'biz-1', slug: 'bc', name: 'GSB', address: 'Rua', city: 'BC' },
      });
      reservationRepo.findOneOrFail.mockResolvedValue({
        id: 'res-1',
        customerId: 'cust-1',
        businessId: 'biz-1',
        status: ReservationStatus.CANCELLED,
        startAt: new Date('2026-08-18T18:00:00.000Z'),
        endAt: new Date('2026-08-18T19:00:00.000Z'),
        createdAt: new Date('2026-08-18T10:00:00.000Z'),
        bay: { id: 'bay-1', code: 'BAY-1', name: 'Bay 1' },
        business: { id: 'biz-1', slug: 'bc', name: 'GSB', address: 'Rua', city: 'BC' },
      });

      const result = await service.cancelCustomerReservation('cust-1', 'res-1');
      expect(reservationRepo.update).toHaveBeenCalledWith('res-1', {
        status: ReservationStatus.CANCELLED,
      });
      expect(result.status).toBe(ReservationStatus.CANCELLED);
    });

    it('rejects cancel when already checked in', async () => {
      reservationRepo.findOne.mockResolvedValue({
        id: 'res-1',
        customerId: 'cust-1',
        status: ReservationStatus.CHECKED_IN,
      });
      await expect(service.cancelCustomerReservation('cust-1', 'res-1')).rejects.toMatchObject({
        code: 'CANNOT_CANCEL',
      });
    });
  });
});
