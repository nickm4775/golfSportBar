import 'package:folf/core/validation/brazil.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('isValidCpf', () {
    test('accepts valid CPFs', () {
      expect(isValidCpf('529.982.247-25'), isTrue);
      expect(isValidCpf('39053344705'), isTrue);
      expect(isValidCpf('11144477735'), isTrue);
    });

    test('rejects malformed or sequential CPFs', () {
      expect(isValidCpf('111.111.111-11'), isFalse);
      expect(isValidCpf('12345678900'), isFalse);
      expect(isValidCpf('52998224724'), isFalse);
      expect(isValidCpf(''), isFalse);
    });
  });

  group('onlyDigits', () {
    test('strips non-digit characters', () {
      expect(onlyDigits('(47) 99911-0011'), '47999110011');
      expect(onlyDigits('529.982.247-25'), '52998224725');
    });
  });

  group('formatCpf', () {
    test('formats 11 digits', () {
      expect(formatCpf('52998224725'), '529.982.247-25');
    });

    test('returns original when incomplete', () {
      expect(formatCpf('5299822'), '5299822');
    });
  });

  group('phone', () {
    test('normalizes DDD+mobile to E.164 digits', () {
      expect(normalizePhoneBr('(47) 99911-0011'), '5547999110011');
      expect(onlyDigits('+55 47 99911-0011'), '5547999110011');
      expect(isValidMobileBr('5547999110011'), isTrue);
    });

    test('rejects landlines and short numbers', () {
      expect(isValidMobileBr('554733330011'), isFalse);
      expect(isValidMobileBr('4799911001'), isFalse);
    });
  });

  group('isAdult', () {
    test('requires 18 years', () {
      final now = DateTime.utc(2026, 8, 18);
      expect(isAdult('2008-08-18', now), isTrue);
      expect(isAdult('2008-08-19', now), isFalse);
      expect(isAdult('2010-01-01', now), isFalse);
    });
  });

  group('parseIsoDate', () {
    test('parses YYYY-MM-DD', () {
      final date = parseIsoDate('1994-03-12');
      expect(date, DateTime.utc(1994, 3, 12));
    });

    test('returns null for invalid input', () {
      expect(parseIsoDate('12-03-1994'), isNull);
      expect(parseIsoDate('invalid'), isNull);
    });
  });

  group('isValidEmail', () {
    test('accepts valid emails', () {
      expect(isValidEmail('ana.souza@mail.com'), isTrue);
    });

    test('rejects invalid emails', () {
      expect(isValidEmail('not-an-email'), isFalse);
      expect(isValidEmail(''), isFalse);
    });
  });
}
