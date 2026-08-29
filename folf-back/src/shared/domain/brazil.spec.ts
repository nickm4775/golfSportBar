import {
  assertAdult,
  isValidCpf,
  isValidMobileBr,
  maskCpf,
  normalizePhoneBr,
  onlyDigits,
} from './brazil';

describe('brazil cadastro helpers', () => {
  describe('isValidCpf', () => {
    it('accepts valid CPFs', () => {
      expect(isValidCpf('529.982.247-25')).toBe(true);
      expect(isValidCpf('39053344705')).toBe(true);
      expect(isValidCpf('11144477735')).toBe(true);
    });

    it('rejects malformed or sequential CPFs', () => {
      expect(isValidCpf('111.111.111-11')).toBe(false);
      expect(isValidCpf('12345678900')).toBe(false);
      expect(isValidCpf('52998224724')).toBe(false);
      expect(isValidCpf('')).toBe(false);
    });
  });

  describe('maskCpf', () => {
    it('keeps only the last two digits visible', () => {
      expect(maskCpf('52998224725')).toBe('***.***.***-25');
    });
  });

  describe('phone', () => {
    it('normalizes DDD+mobile to E.164 digits', () => {
      expect(normalizePhoneBr('(47) 99911-0011')).toBe('5547999110011');
      expect(onlyDigits('+55 47 99911-0011')).toBe('5547999110011');
      expect(isValidMobileBr('5547999110011')).toBe(true);
    });

    it('rejects landlines and short numbers', () => {
      expect(isValidMobileBr('554733330011')).toBe(false);
      expect(isValidMobileBr('4799911001')).toBe(false);
    });
  });

  describe('assertAdult', () => {
    it('requires 18 years', () => {
      const now = new Date(Date.UTC(2026, 7, 18));
      expect(assertAdult(new Date(Date.UTC(2008, 7, 18)), now)).toBe(true);
      expect(assertAdult(new Date(Date.UTC(2008, 7, 19)), now)).toBe(false);
      expect(assertAdult(new Date(Date.UTC(2010, 0, 1)), now)).toBe(false);
    });
  });
});
