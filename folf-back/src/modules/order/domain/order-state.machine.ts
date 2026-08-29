import { OrderItemStatus, OrderStatus } from '../../../shared/domain/enums';
import { DomainException } from '../../../shared/domain/domain.exception';

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.OPEN, OrderStatus.CANCELLED],
  [OrderStatus.OPEN]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

const ITEM_TRANSITIONS: Record<OrderItemStatus, OrderItemStatus[]> = {
  [OrderItemStatus.PENDING]: [OrderItemStatus.PREPARING, OrderItemStatus.CANCELLED],
  [OrderItemStatus.PREPARING]: [OrderItemStatus.SERVED, OrderItemStatus.CANCELLED],
  [OrderItemStatus.SERVED]: [],
  [OrderItemStatus.CANCELLED]: [],
};

export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!ORDER_TRANSITIONS[from].includes(to)) {
    throw new DomainException(
      `Cannot transition order from ${from} to ${to}`,
      'INVALID_ORDER_TRANSITION',
    );
  }
}

export function assertItemTransition(from: OrderItemStatus, to: OrderItemStatus) {
  if (!ITEM_TRANSITIONS[from].includes(to)) {
    throw new DomainException(
      `Cannot transition item from ${from} to ${to}`,
      'INVALID_ITEM_TRANSITION',
    );
  }
}

export function calculateOrderTotal(
  items: Array<{ quantity: number; unitPriceBrl: number | { toString(): string } }>,
) {
  return items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPriceBrl),
    0,
  );
}
