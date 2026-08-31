const _cpfBlacklist = {
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
};

String onlyDigits(String value) => value.replaceAll(RegExp(r'\D'), '');

bool isValidCpf(String value) {
  final cpf = onlyDigits(value);
  if (cpf.length != 11 || _cpfBlacklist.contains(cpf)) return false;

  final digits = cpf.split('').map(int.parse).toList();

  int checkDigit(int factor) {
    final sum = digits
        .take(factor - 1)
        .toList()
        .asMap()
        .entries
        .fold(0, (total, entry) => total + entry.value * (factor - entry.key));
    final remainder = (sum * 10) % 11;
    return remainder == 10 ? 0 : remainder;
  }

  return checkDigit(10) == digits[9] && checkDigit(11) == digits[10];
}

String formatCpf(String value) {
  final cpf = onlyDigits(value);
  if (cpf.length != 11) return value;
  return '${cpf.substring(0, 3)}.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-${cpf.substring(9)}';
}

String normalizePhoneBr(String value) {
  var digits = onlyDigits(value);
  if (digits.startsWith('0')) {
    digits = digits.replaceFirst(RegExp(r'^0+'), '');
  }
  if (digits.length == 11) digits = '55$digits';
  if (digits.length == 13 && digits.startsWith('55')) return digits;
  return digits;
}

bool isValidMobileBr(String value) {
  final digits = normalizePhoneBr(value);
  if (!RegExp(r'^55\d{11}$').hasMatch(digits)) return false;
  final ddd = int.parse(digits.substring(2, 4));
  final subscriber = digits.substring(4);
  return ddd >= 11 && ddd <= 99 && subscriber.startsWith('9') && subscriber.length == 9;
}

DateTime? parseIsoDate(String value) {
  final match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(value);
  if (match == null) return null;
  return DateTime.utc(
    int.parse(match.group(1)!),
    int.parse(match.group(2)!),
    int.parse(match.group(3)!),
  );
}

bool isAdult(String value, [DateTime? now]) {
  final birthDate = parseIsoDate(value);
  if (birthDate == null) return false;
  final today = now ?? DateTime.now().toUtc();
  var age = today.year - birthDate.year;
  if (today.month < birthDate.month ||
      (today.month == birthDate.month && today.day < birthDate.day)) {
    age -= 1;
  }
  return age >= 18;
}

bool isValidEmail(String value) {
  final trimmed = value.trim().toLowerCase();
  return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(trimmed);
}
