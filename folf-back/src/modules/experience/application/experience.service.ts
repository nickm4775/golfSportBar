import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from '../../business/application/business.service';
import { CatalogService } from '../../catalog/application/catalog.service';
import { GsproService } from '../../gspro/application/gspro.service';

@Injectable()
export class PublicVenueService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly catalogService: CatalogService,
    private readonly gsproService: GsproService,
  ) {}

  listVenues() {
    return this.businessService.listPublicVenues();
  }

  getVenue(businessId: string) {
    return this.businessService.findPublicVenue(businessId);
  }

  async getMenu(businessId: string, category?: string) {
    await this.businessService.findPublicVenue(businessId);
    return this.catalogService.getMenu(businessId, category, false);
  }

  async listBays(businessId: string) {
    await this.businessService.findPublicVenue(businessId);
    const bays = await this.gsproService.listBays(businessId, false);
    return bays.map((bay) => ({
      id: bay.id,
      code: bay.code,
      name: bay.name,
    }));
  }

  async getAvailability(businessId: string, date: string, bayId?: string) {
    const venue = await this.businessService.findPublicVenue(businessId);
    return this.gsproService.getAvailability(businessId, date, venue.timezone, bayId);
  }
}

export type QrKind = 'table' | 'reservation' | 'url' | 'unknown';

export interface QrResolveResult {
  kind: QrKind;
  businessId?: string;
  tableLabel?: string;
  reservationId?: string;
  url?: string;
  raw: string;
}

const UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const TABLE_RE = new RegExp(`^gsb:table:(${UUID}):(.+)$`, 'i');
const RESERVATION_RE = new RegExp(`^gsb:reservation:(${UUID})$`, 'i');

@Injectable()
export class QrResolveService {
  constructor(
    private readonly businessService: BusinessService,
    private readonly gsproService: GsproService,
  ) {}

  async resolve(payload: string): Promise<QrResolveResult> {
    const raw = payload.trim();
    const parsed = this.parse(raw);

    if (parsed.kind === 'table' && parsed.businessId) {
      await this.businessService.findPublicVenue(parsed.businessId);
    }

    if (parsed.kind === 'reservation' && parsed.reservationId) {
      const exists = await this.gsproService.reservationExists(parsed.reservationId);
      if (!exists) throw new NotFoundException('Reservation not found');
    }

    return parsed;
  }

  parse(raw: string): QrResolveResult {
    const table = TABLE_RE.exec(raw);
    if (table) {
      return {
        kind: 'table',
        businessId: table[1].toLowerCase(),
        tableLabel: table[2].trim(),
        raw,
      };
    }

    const reservation = RESERVATION_RE.exec(raw);
    if (reservation) {
      return {
        kind: 'reservation',
        reservationId: reservation[1].toLowerCase(),
        raw,
      };
    }

    if (/^https?:\/\//i.test(raw)) {
      return { kind: 'url', url: raw, raw };
    }

    const json = this.parseJson(raw);
    if (json) return { ...json, raw };

    return { kind: 'unknown', raw };
  }

  private parseJson(raw: string): Omit<QrResolveResult, 'raw'> | null {
    if (!raw.startsWith('{')) return null;
    try {
      const body = JSON.parse(raw) as Record<string, unknown>;
      const type = typeof body.type === 'string' ? body.type.toLowerCase() : '';
      if (type === 'table' && typeof body.businessId === 'string' && typeof body.tableLabel === 'string') {
        return {
          kind: 'table',
          businessId: body.businessId,
          tableLabel: body.tableLabel.trim(),
        };
      }
      if (type === 'reservation' && typeof body.reservationId === 'string') {
        return { kind: 'reservation', reservationId: body.reservationId };
      }
      if (type === 'url' && typeof body.url === 'string') {
        return { kind: 'url', url: body.url };
      }
    } catch {
      return null;
    }
    return null;
  }
}
