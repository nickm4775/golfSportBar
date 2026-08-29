import { NotFoundException } from '@nestjs/common';
import { QrResolveService } from './experience.service';
import { BusinessService } from '../../business/application/business.service';
import { GsproService } from '../../gspro/application/gspro.service';

describe('QrResolveService', () => {
  const businessId = '11111111-1111-4111-8111-111111111111';
  const reservationId = '22222222-2222-4222-8222-222222222222';
  let service: QrResolveService;
  let businessService: { findPublicVenue: jest.Mock };
  let gsproService: { reservationExists: jest.Mock };

  beforeEach(() => {
    businessService = { findPublicVenue: jest.fn().mockResolvedValue({ id: businessId }) };
    gsproService = { reservationExists: jest.fn().mockResolvedValue(true) };
    service = new QrResolveService(
      businessService as unknown as BusinessService,
      gsproService as unknown as GsproService,
    );
  });

  it('parses table payloads', () => {
    expect(service.parse(`gsb:table:${businessId}:Mesa 4`)).toMatchObject({
      kind: 'table',
      businessId,
      tableLabel: 'Mesa 4',
    });
  });

  it('parses reservation payloads', () => {
    expect(service.parse(`gsb:reservation:${reservationId}`)).toMatchObject({
      kind: 'reservation',
      reservationId,
    });
  });

  it('parses http URLs', () => {
    expect(service.parse('https://instagram.com/golfsportbarbc/')).toMatchObject({
      kind: 'url',
      url: 'https://instagram.com/golfsportbarbc/',
    });
  });

  it('parses JSON table payloads', () => {
    expect(
      service.parse(
        JSON.stringify({ type: 'table', businessId, tableLabel: 'Bay 2' }),
      ),
    ).toMatchObject({ kind: 'table', businessId, tableLabel: 'Bay 2' });
  });

  it('returns unknown for free text', () => {
    expect(service.parse('not a qr')).toMatchObject({ kind: 'unknown' });
  });

  it('validates the venue for table QRs', async () => {
    await service.resolve(`gsb:table:${businessId}:Mesa 1`);
    expect(businessService.findPublicVenue).toHaveBeenCalledWith(businessId);
  });

  it('404s when the reservation does not exist', async () => {
    gsproService.reservationExists.mockResolvedValue(false);
    await expect(service.resolve(`gsb:reservation:${reservationId}`)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
