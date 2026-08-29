import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';

enum AppNotificationKind { orderReady }

class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.kind,
    required this.createdAt,
    this.orderId,
    this.read = false,
  });

  final String id;
  final AppNotificationKind kind;
  final DateTime createdAt;
  final String? orderId;
  final bool read;

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      kind: kind,
      createdAt: createdAt,
      orderId: orderId,
      read: read ?? this.read,
    );
  }

  @override
  List<Object?> get props => [id, kind, createdAt, orderId, read];
}

class NotificationsState extends Equatable {
  const NotificationsState({this.items = const []});

  final List<AppNotification> items;

  int get unread => items.where((item) => !item.read).length;

  @override
  List<Object?> get props => [items];
}

class NotificationsCubit extends Cubit<NotificationsState> {
  NotificationsCubit(AuthBloc auth) : super(const NotificationsState()) {
    _authSub = auth.stream.listen((authState) {
      if (authState is AuthUnauthenticated) clear();
    });
  }

  late final StreamSubscription<AuthState> _authSub;

  void pushOrderReady({String? orderId}) {
    if (orderId != null &&
        state.items.any(
          (item) => !item.read && item.kind == AppNotificationKind.orderReady && item.orderId == orderId,
        )) {
      return;
    }
    final next = AppNotification(
      id: '${DateTime.now().microsecondsSinceEpoch}',
      kind: AppNotificationKind.orderReady,
      createdAt: DateTime.now(),
      orderId: orderId,
    );
    emit(NotificationsState(items: [next, ...state.items].take(20).toList()));
  }

  void markAllRead() {
    if (state.unread == 0) return;
    emit(
      NotificationsState(
        items: state.items.map((item) => item.copyWith(read: true)).toList(),
      ),
    );
  }

  void clear() => emit(const NotificationsState());

  @override
  Future<void> close() async {
    await _authSub.cancel();
    return super.close();
  }
}
