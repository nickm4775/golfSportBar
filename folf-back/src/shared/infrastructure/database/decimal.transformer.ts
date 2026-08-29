import type { ValueTransformer } from 'typeorm';

export const decimalTransformer: ValueTransformer = {
  to: (value: number | string) => value,
  from: (value: string | null) => (value === null ? 0 : parseFloat(value)),
};

export const nullableDecimalTransformer: ValueTransformer = {
  to: (value: number | string | null) => value,
  from: (value: string | null) => (value === null ? null : parseFloat(value)),
};
