import 'package:flutter/material.dart';
import 'package:folf/core/validation/brazil.dart';
import 'package:folf/l10n/app_localizations.dart';

class AuthValidators {
  AuthValidators._();

  static String? requiredField(AppLocalizations l10n, String? value) {
    if (value == null || value.trim().isEmpty) return l10n.fieldRequired;
    return null;
  }

  static String? loginIdentifier(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;

    final trimmed = value!.trim();
    if (trimmed.contains('@')) {
      return isValidEmail(trimmed) ? null : l10n.invalidEmail;
    }

    final digits = onlyDigits(trimmed);
    if (digits.length != 11) return l10n.invalidCpf;
    return isValidCpf(trimmed) ? null : l10n.invalidCpf;
  }

  static String? password(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;
    if (value!.length < 6) return l10n.passwordMinLength;
    return null;
  }

  static String? fullName(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;
    if (value!.trim().length < 2) return l10n.fullNameMinLength;
    return null;
  }

  static String? cpf(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;
    final digits = onlyDigits(value!);
    if (digits.length != 11 || !isValidCpf(value)) return l10n.invalidCpf;
    return null;
  }

  static String? birthDate(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;
    if (parseIsoDate(value!) == null) return l10n.invalidBirthDate;
    if (!isAdult(value)) return l10n.underage;
    return null;
  }

  static String? email(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;
    return isValidEmail(value!) ? null : l10n.invalidEmail;
  }

  static String? phone(AppLocalizations l10n, String? value) {
    final required = requiredField(l10n, value);
    if (required != null) return required;
    return isValidMobileBr(value!) ? null : l10n.invalidPhone;
  }

  static String? state(AppLocalizations l10n, String? value) {
    if (value == null || value.trim().isEmpty) return null;
    if (value.trim().length > 2) return l10n.invalidState;
    return null;
  }

  static bool validateStep(GlobalKey<FormState> formKey) {
    return formKey.currentState?.validate() ?? false;
  }
}
