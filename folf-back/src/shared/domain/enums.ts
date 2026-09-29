export enum RoleScope {
  SYSTEM = 'SYSTEM',
  BUSINESS = 'BUSINESS',
}

export enum UserKind {
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}

export enum OrderStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentProvider {
  MERCADOPAGO = 'MERCADOPAGO',
}

export enum PrepStation {
  KITCHEN = 'KITCHEN',
  BAR = 'BAR',
  RECEIPT = 'RECEIPT',
}

export enum PrintExecutionMode {
  DIRECT = 'DIRECT',
  AGENT = 'AGENT',
}

export enum PrinterConnectionStatus {
  UNKNOWN = 'UNKNOWN',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export enum PrinterConnectionType {
  NETWORK = 'network',
  USB = 'usb',
  BLUETOOTH = 'bluetooth',
}

export enum PrintJobStatus {
  PENDING = 'PENDING',
  PRINTED = 'PRINTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PrintJobExecutedBy {
  SERVER = 'SERVER',
  AGENT = 'AGENT',
}
