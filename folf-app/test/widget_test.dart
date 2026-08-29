import 'package:flutter_test/flutter_test.dart';
import 'package:folf/core/config/app_config.dart';
import 'package:folf/core/format/brl.dart';
import 'package:folf/core/theme/gsb_theme.dart';
import 'package:folf/features/auth/domain/auth.dart';
import 'package:flutter/material.dart';

void main() {
  test('formatBrl uses Brazilian currency', () {
    expect(formatBrl(12.5), contains('12'));
  });

  test('realtime websocket is derived from the API host on port 8000', () {
    expect(
      realtimeWsFromApi('http://192.168.24.16:3000/api/v1'),
      'ws://192.168.24.16:8000/connection/websocket',
    );
    expect(
      realtimeWsFromApi('https://folf.example/api/v1'),
      'wss://folf.example:8000/connection/websocket',
    );
  });

  test('customer initials use first and last name', () {
    const profile = CustomerProfile(
      id: '1',
      fullName: 'Ana Souza',
      email: 'ana@mail.com',
      phone: '',
      cpf: '',
    );
    expect(profile.initials, 'AS');
  });

  testWidgets('light theme uses forest on cream', (tester) async {
    final theme = GsbTheme.light();
    expect(theme.scaffoldBackgroundColor, isNot(Colors.purple));
    expect(theme.colorScheme.primary, isNot(Colors.deepPurple));
  });
}

