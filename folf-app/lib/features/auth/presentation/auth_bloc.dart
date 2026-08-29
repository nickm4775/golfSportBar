import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/auth/domain/auth.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

class AuthHydrated extends AuthEvent {
  const AuthHydrated();
}

class AuthLoginSubmitted extends AuthEvent {
  const AuthLoginSubmitted(this.identifier, this.password);
  final String identifier;
  final String password;
  @override
  List<Object?> get props => [identifier, password];
}

class AuthRegisterSubmitted extends AuthEvent {
  const AuthRegisterSubmitted(this.payload);
  final RegisterPayload payload;
  @override
  List<Object?> get props => [payload];
}

class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}

sealed class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthUnknown extends AuthState {
  const AuthUnknown();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated({this.message});
  final String? message;
  @override
  List<Object?> get props => [message];
}

class AuthAuthenticated extends AuthState {
  const AuthAuthenticated(this.profile);
  final CustomerProfile profile;
  @override
  List<Object?> get props => [profile.id, profile.email];
}

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  AuthBloc(this._repository) : super(const AuthUnknown()) {
    on<AuthHydrated>(_onHydrate);
    on<AuthLoginSubmitted>(_onLogin);
    on<AuthRegisterSubmitted>(_onRegister);
    on<AuthLogoutRequested>(_onLogout);
  }

  final AuthRepository _repository;

  Future<void> _onHydrate(AuthHydrated event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    final profile = await _repository.restore();
    emit(profile == null ? const AuthUnauthenticated() : AuthAuthenticated(profile));
  }

  Future<void> _onLogin(AuthLoginSubmitted event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    try {
      final profile = await _repository.login(event.identifier, event.password);
      emit(AuthAuthenticated(profile));
    } on Failure catch (error) {
      emit(AuthUnauthenticated(message: error.message));
    } catch (_) {
      emit(const AuthUnauthenticated(message: 'Não foi possível entrar.'));
    }
  }

  Future<void> _onRegister(AuthRegisterSubmitted event, Emitter<AuthState> emit) async {
    emit(const AuthLoading());
    try {
      final profile = await _repository.register(event.payload);
      emit(AuthAuthenticated(profile));
    } on Failure catch (error) {
      emit(AuthUnauthenticated(message: error.message));
    } catch (_) {
      emit(const AuthUnauthenticated(message: 'Não foi possível criar a conta.'));
    }
  }

  Future<void> _onLogout(AuthLogoutRequested event, Emitter<AuthState> emit) async {
    await _repository.logout();
    emit(const AuthUnauthenticated());
  }
}
