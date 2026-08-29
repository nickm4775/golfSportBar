import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/reservation/domain/availability_slots.dart' as slots;
import 'package:folf/features/reservation/domain/reservation.dart';
import 'package:folf/features/venue/domain/venue.dart';

class ReservationViewState extends Equatable {
  const ReservationViewState({
    this.loading = true,
    this.submitting = false,
    this.bays = const [],
    this.availability,
    this.mine = const [],
    this.selectedBayId,
    this.day,
    this.duration = const Duration(hours: 1),
    this.selectedStart,
    this.message,
    this.created,
  });

  final bool loading;
  final bool submitting;
  final List<Bay> bays;
  final DayAvailability? availability;
  final List<Reservation> mine;
  final String? selectedBayId;
  final DateTime? day;
  final Duration duration;
  final DateTime? selectedStart;
  final String? message;
  final Reservation? created;

  ReservationViewState copyWith({
    bool? loading,
    bool? submitting,
    List<Bay>? bays,
    DayAvailability? availability,
    List<Reservation>? mine,
    String? selectedBayId,
    DateTime? day,
    Duration? duration,
    DateTime? selectedStart,
    String? message,
    Reservation? created,
    bool clearStart = false,
  }) {
    return ReservationViewState(
      loading: loading ?? this.loading,
      submitting: submitting ?? this.submitting,
      bays: bays ?? this.bays,
      availability: availability ?? this.availability,
      mine: mine ?? this.mine,
      selectedBayId: selectedBayId ?? this.selectedBayId,
      day: day ?? this.day,
      duration: duration ?? this.duration,
      selectedStart: clearStart ? null : (selectedStart ?? this.selectedStart),
      message: message,
      created: created,
    );
  }

  @override
  List<Object?> get props => [
        loading,
        submitting,
        bays,
        availability,
        mine,
        selectedBayId,
        day,
        duration,
        selectedStart,
        message,
        created?.id,
      ];
}

class ReservationCubit extends Cubit<ReservationViewState> {
  ReservationCubit({
    required VenueRepository venues,
    required ReservationRepository reservations,
  })  : _venues = venues,
        _reservations = reservations,
        super(const ReservationViewState());

  final VenueRepository _venues;
  final ReservationRepository _reservations;
  String? _initialBayId;

  void setInitialBayId(String? bayId) {
    _initialBayId = bayId;
  }

  Future<void> bootstrap(String businessId) async {
    emit(state.copyWith(loading: true, message: null));
    try {
      final bays = await _venues.listBays(businessId);
      final mine = await _reservations.listMine();
      final day = DateTime.now();
      final selectedBayId = _resolveSelectedBayId(bays);
      emit(
        state.copyWith(
          loading: false,
          bays: bays,
          mine: mine,
          selectedBayId: selectedBayId,
          day: DateTime(day.year, day.month, day.day),
        ),
      );
      if (bays.isNotEmpty) {
        await loadAvailability(businessId);
      }
    } on Failure catch (error) {
      emit(state.copyWith(loading: false, message: error.message));
    }
  }

  Future<void> loadAvailability(String businessId) async {
    final day = state.day ?? DateTime.now();
    final date = '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    try {
      final availability = await _venues.getAvailability(
        businessId,
        date,
        bayId: state.selectedBayId,
      );
      emit(state.copyWith(availability: availability, clearStart: true));
    } on Failure catch (error) {
      emit(state.copyWith(message: error.message));
    }
  }

  void selectBay(String businessId, String bayId) {
    emit(state.copyWith(selectedBayId: bayId, clearStart: true));
    loadAvailability(businessId);
  }

  void selectDay(String businessId, DateTime day) {
    emit(state.copyWith(day: DateTime(day.year, day.month, day.day), clearStart: true));
    loadAvailability(businessId);
  }

  void selectDuration(Duration duration) {
    emit(state.copyWith(duration: duration, clearStart: true));
  }

  void selectStart(DateTime start) {
    emit(state.copyWith(selectedStart: start));
  }

  Future<void> submit(String businessId) async {
    final start = state.selectedStart;
    final bayId = state.selectedBayId;
    if (start == null || bayId == null) return;
    emit(state.copyWith(submitting: true, message: null));
    try {
      final created = await _reservations.create(
        businessId: businessId,
        bayId: bayId,
        startAt: start,
        endAt: start.add(state.duration),
      );
      final mine = await _reservations.listMine();
      emit(state.copyWith(submitting: false, created: created, mine: mine, clearStart: true));
    } on Failure catch (error) {
      emit(state.copyWith(submitting: false, message: error.message));
    }
  }

  Future<void> cancel(String id) async {
    try {
      await _reservations.cancel(id);
      final mine = await _reservations.listMine();
      emit(state.copyWith(mine: mine));
    } on Failure catch (error) {
      emit(state.copyWith(message: error.message));
    }
  }

  String? _resolveSelectedBayId(List<Bay> bays) {
    if (bays.isEmpty) return null;
    final initial = _initialBayId;
    if (initial != null && bays.any((bay) => bay.id == initial)) {
      return initial;
    }
    return bays.first.id;
  }

  List<DateTime> freeStarts() {
    final day = state.day;
    final bayId = state.selectedBayId;
    if (day == null || bayId == null) return [];
    final busy = state.availability?.bays
            .where((row) => row.bay.id == bayId)
            .expand((row) => row.busy)
            .toList() ??
        [];
    return slots.freeStarts(
      day: day,
      duration: state.duration,
      busy: busy,
    );
  }
}
