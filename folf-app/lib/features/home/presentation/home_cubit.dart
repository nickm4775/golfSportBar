import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/order/domain/order.dart';
import 'package:folf/features/reservation/domain/reservation.dart';
import 'package:folf/features/venue/domain/venue.dart';

class HomeState extends Equatable {
  const HomeState({
    this.loading = true,
    this.venues = const [],
    this.menu,
    this.reservations = const [],
    this.orders = const [],
    this.message,
  });

  final bool loading;
  final List<Venue> venues;
  final MenuCatalog? menu;
  final List<Reservation> reservations;
  final List<CustomerOrder> orders;
  final String? message;

  Reservation? get nextReservation {
    final upcoming = reservations
        .where((row) => row.status == 'PENDING' || row.status == 'CONFIRMED' || row.status == 'CHECKED_IN')
        .toList()
      ..sort((a, b) => a.startAt.compareTo(b.startAt));
    return upcoming.isEmpty ? null : upcoming.first;
  }

  CustomerOrder? get activeOrder {
    final open = orders.where((row) => row.isActive).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return open.isEmpty ? null : open.first;
  }

  HomeState copyWith({
    bool? loading,
    List<Venue>? venues,
    MenuCatalog? menu,
    List<Reservation>? reservations,
    List<CustomerOrder>? orders,
    String? message,
  }) {
    return HomeState(
      loading: loading ?? this.loading,
      venues: venues ?? this.venues,
      menu: menu ?? this.menu,
      reservations: reservations ?? this.reservations,
      orders: orders ?? this.orders,
      message: message,
    );
  }

  @override
  List<Object?> get props => [loading, venues, menu, reservations, orders, message];
}

class HomeCubit extends Cubit<HomeState> {
  HomeCubit({
    required VenueRepository venues,
    required ReservationRepository reservations,
    required OrderRepository orders,
  })  : _venues = venues,
        _reservations = reservations,
        _orders = orders,
        super(const HomeState());

  final VenueRepository _venues;
  final ReservationRepository _reservations;
  final OrderRepository _orders;

  Future<List<Venue>> load({String? businessId}) async {
    emit(state.copyWith(loading: true, message: null));
    try {
      final venues = await _venues.listVenues();
      final venueId = businessId ?? (venues.isNotEmpty ? venues.first.id : null);
      MenuCatalog? menu;
      if (venueId != null) {
        menu = await _venues.getMenu(venueId);
      }
      final reservations = await _reservations.listMine();
      final orders = await _orders.listMine();
      emit(
        state.copyWith(
          loading: false,
          venues: venues,
          menu: menu,
          reservations: reservations,
          orders: orders,
        ),
      );
      return venues;
    } on Failure catch (error) {
      emit(state.copyWith(loading: false, message: error.message));
      return state.venues;
    } catch (_) {
      emit(state.copyWith(loading: false, message: ''));
      return state.venues;
    }
  }

  Future<void> refreshOrders() async {
    try {
      final orders = await _orders.listMine();
      emit(state.copyWith(orders: orders));
    } on Failure {
      // Keep the last known list; realtime retries on the next event.
    }
  }
}
