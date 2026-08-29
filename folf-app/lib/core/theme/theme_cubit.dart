import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeCubit extends Cubit<ThemeMode> {
  ThemeCubit(this._prefs) : super(_read(_prefs));

  final SharedPreferences _prefs;
  static const _key = 'gsb-theme';

  static ThemeMode _read(SharedPreferences prefs) {
    return switch (prefs.getString(_key)) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
  }

  Future<void> toggle({required Brightness platform}) async {
    final next = state == ThemeMode.dark ||
            (state == ThemeMode.system && platform == Brightness.dark)
        ? ThemeMode.light
        : ThemeMode.dark;
    await setMode(next);
  }

  Future<void> setMode(ThemeMode mode) async {
    await _prefs.setString(
      _key,
      switch (mode) {
        ThemeMode.light => 'light',
        ThemeMode.dark => 'dark',
        ThemeMode.system => 'system',
      },
    );
    emit(mode);
  }
}

class LocaleCubit extends Cubit<Locale> {
  LocaleCubit(this._prefs) : super(_read(_prefs));

  final SharedPreferences _prefs;
  static const _key = 'gsb-locale';
  static const supported = [
    Locale('pt'),
    Locale('es'),
    Locale('en'),
    Locale('it'),
    Locale('zh'),
  ];

  static Locale _read(SharedPreferences prefs) {
    final saved = prefs.getString(_key);
    return supported.firstWhere(
      (locale) => locale.languageCode == saved,
      orElse: () => const Locale('pt'),
    );
  }

  Future<void> setLocale(Locale locale) async {
    await _prefs.setString(_key, locale.languageCode);
    emit(locale);
  }
}
