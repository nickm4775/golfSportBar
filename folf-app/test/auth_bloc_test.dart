import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:folf/features/auth/domain/auth.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:mocktail/mocktail.dart';

class _AuthRepo extends Mock implements AuthRepository {}

void main() {
  late _AuthRepo repository;

  setUp(() {
    repository = _AuthRepo();
  });

  blocTest<AuthBloc, AuthState>(
    'emits authenticated on successful login',
    build: () {
      when(() => repository.login(any(), any())).thenAnswer(
        (_) async => const CustomerProfile(
          id: '1',
          fullName: 'Ana Souza',
          email: 'ana@mail.com',
          phone: '5547999110011',
          cpf: '52998224725',
        ),
      );
      return AuthBloc(repository);
    },
    act: (bloc) => bloc.add(const AuthLoginSubmitted('ana@mail.com', 'Secret123!')),
    expect: () => [
      const AuthLoading(),
      isA<AuthAuthenticated>(),
    ],
  );
}
