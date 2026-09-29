import { PaymentMethod } from '../../../shared/domain/enums';
import { paymentMethodLabel } from './payment-method-label';

describe('paymentMethodLabel', () => {
  it.each([
    [PaymentMethod.CASH, 'Dinheiro'],
    [PaymentMethod.PIX, 'PIX'],
    [PaymentMethod.CREDIT_CARD, 'Cartão de crédito'],
    [PaymentMethod.DEBIT_CARD, 'Cartão de débito'],
  ])('maps %s to its receipt label', (method, label) => {
    expect(paymentMethodLabel(method)).toBe(label);
  });

  it('returns null when there is no payment', () => {
    expect(paymentMethodLabel(null)).toBeNull();
    expect(paymentMethodLabel(undefined)).toBeNull();
  });
});
