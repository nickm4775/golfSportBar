const CPF_BLACKLIST = new Set(
  Array.from({ length: 10 }, (_, index) => String(index).repeat(11)),
);

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || CPF_BLACKLIST.has(cpf)) return false;

  const digits = cpf.split('').map(Number);
  const checkDigit = (factor: number) => {
    const sum = digits
      .slice(0, factor - 1)
      .reduce((total, digit, index) => total + digit * (factor - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return checkDigit(10) === digits[9] && checkDigit(11) === digits[10];
}

export function maskCpf(value: string): string {
  const cpf = onlyDigits(value).padStart(11, '*').slice(-11);
  return `***.***.***-${cpf.slice(-2)}`;
}

export function formatCpf(value: string): string {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return value;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export function normalizePhoneBr(value: string): string {
  let digits = onlyDigits(value);
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if (digits.length === 11) digits = `55${digits}`;
  if (digits.length === 13 && digits.startsWith('55')) return digits;
  return digits;
}

export function isValidMobileBr(value: string): boolean {
  const digits = normalizePhoneBr(value);
  if (!/^55\d{11}$/.test(digits)) return false;
  const ddd = Number(digits.slice(2, 4));
  const subscriber = digits.slice(4);
  return ddd >= 11 && ddd <= 99 && subscriber.startsWith('9') && subscriber.length === 9;
}

export function assertAdult(birthDate: Date, now = new Date()): boolean {
  const age =
    now.getUTCFullYear() -
    birthDate.getUTCFullYear() -
    (now.getUTCMonth() < birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() &&
      now.getUTCDate() < birthDate.getUTCDate())
      ? 1
      : 0);
  return age >= 18;
}

export function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    throw new Error('INVALID_DATE');
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}
