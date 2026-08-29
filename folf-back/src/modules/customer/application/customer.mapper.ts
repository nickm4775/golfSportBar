import { Customer } from '../../../shared/infrastructure/database/entities/customer.entity';
import { maskCpf } from '../../../shared/domain/brazil';

export type CustomerView = {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  postalCode: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  lgpdAcceptedAt: Date;
  hasLogin: boolean;
  isActive: boolean;
  createdAt: Date;
};

export function toCustomerView(customer: Customer, options?: { maskCpf?: boolean }): CustomerView {
  const birthDate =
    typeof customer.birthDate === 'string'
      ? customer.birthDate.slice(0, 10)
      : new Date(customer.birthDate).toISOString().slice(0, 10);

  return {
    id: customer.id,
    fullName: customer.fullName,
    cpf: options?.maskCpf === false ? customer.cpf : maskCpf(customer.cpf),
    email: customer.email,
    phone: customer.phone,
    birthDate,
    postalCode: customer.postalCode,
    street: customer.street,
    streetNumber: customer.streetNumber,
    complement: customer.complement,
    district: customer.district,
    city: customer.city,
    state: customer.state,
    lgpdAcceptedAt: customer.lgpdAcceptedAt,
    hasLogin: Boolean(customer.userId),
    isActive: customer.isActive,
    createdAt: customer.createdAt,
  };
}
