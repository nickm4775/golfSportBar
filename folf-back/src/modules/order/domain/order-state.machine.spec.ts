import { OrderItemStatus, OrderStatus } from '../../../shared/domain/enums';
import {
  assertItemTransition,
  assertOrderTransition,
  calculateOrderTotal,
  calculateServiceCharge,
} from './order-state.machine';

describe('OrderStateMachine', () => {
  it('allows valid order transitions', () => {
    expect(() => assertOrderTransition(OrderStatus.DRAFT, OrderStatus.OPEN)).not.toThrow();
    expect(() => assertOrderTransition(OrderStatus.OPEN, OrderStatus.IN_PROGRESS)).not.toThrow();
    expect(() => assertOrderTransition(OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED)).not.toThrow();
  });

  it('rejects invalid order transitions', () => {
    expect(() => assertOrderTransition(OrderStatus.COMPLETED, OrderStatus.OPEN)).toThrow(
      'Cannot transition order',
    );
  });

  it('allows valid item transitions', () => {
    expect(() => assertItemTransition(OrderItemStatus.PENDING, OrderItemStatus.PREPARING)).not.toThrow();
    expect(() => assertItemTransition(OrderItemStatus.PREPARING, OrderItemStatus.SERVED)).not.toThrow();
  });

  it('calculates order total', () => {
    expect(
      calculateOrderTotal([
        { quantity: 2, unitPriceBrl: 40 },
        { quantity: 1, unitPriceBrl: 15.5 },
      ]),
    ).toBe(95.5);
  });

  it('calculates 10% service charge when included', () => {
    expect(calculateServiceCharge(95.5, true)).toBe(9.55);
    expect(calculateServiceCharge(10, true)).toBe(1);
    expect(calculateServiceCharge(0.05, true)).toBe(0.01);
  });

  it('returns zero service charge when not included', () => {
    expect(calculateServiceCharge(95.5, false)).toBe(0);
  });
});
