import type { OrderStatus } from './enums';

export type BusinessRealtimeEventType =
  | 'order.changed'
  | 'gspro.changed'
  | 'catalog.changed'
  | 'print.jobs.created'
  | 'print.discover.request'
  | 'print.probe.request'
  | 'print.agent.status';

export interface BusinessRealtimeEvent {
  type: BusinessRealtimeEventType;
  entityId?: string;
  actorUserId?: string;
  status?: OrderStatus;
  requestId?: string;
  station?: string;
  cidr?: string;
  host?: string;
  port?: number;
  jobIds?: string[];
}
