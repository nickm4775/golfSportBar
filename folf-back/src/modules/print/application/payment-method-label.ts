import { PaymentMethod } from '../../../shared/domain/enums';

const LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Dinheiro',
  [PaymentMethod.PIX]: 'PIX',
  [PaymentMethod.CREDIT_CARD]: 'Cartão de crédito',
  [PaymentMethod.DEBIT_CARD]: 'Cartão de débito',
};

export function paymentMethodLabel(method: PaymentMethod | null | undefined): string | null {
  return method ? (LABELS[method] ?? method) : null;
}
