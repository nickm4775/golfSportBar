import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/reservation/domain/availability_slots.dart';
import 'package:folf/features/venue/domain/venue.dart';

enum BayAvailabilityStatus { availableNow, busy, noSlotsToday }

class BayAvailabilityRow extends Equatable {
  const BayAvailabilityRow({
    required this.bay,
    required this.status,
    this.nextSlot,
  });

  final Bay bay;
  final BayAvailabilityStatus status;
  final DateTime? nextSlot;

  @override
  List<Object?> get props => [bay.id, status, nextSlot];
}

class BayAvailabilityViewState extends Equatable {
  const BayAvailabilityViewState({
    this.loading = true,
    this.rows = const [],
    this.message,
  });

  final bool loading;
  final List<BayAvailabilityRow> rows;
  final String? message;

  BayAvailabilityViewState copyWith({
    bool? loading,
    List<BayAvailabilityRow>? rows,
    String? message,
  }) {
    return BayAvailabilityViewState(
      loading: loading ?? this.loading,
      rows: rows ?? this.rows,
      message: message,
    );
  }

  @override
  List<Object?> get props => [loading, rows, message];
}

class BayAvailabilityCubit extends Cubit<BayAvailabilityViewState> {
  BayAvailabilityCubit({required VenueRepository venues})
      : _venues = venues,
        super(const BayAvailabilityViewState());

  final VenueRepository _venues;

  Future<void> bootstrap(String businessId) async {
    emit(state.copyWith(loading: true, message: null));
    await _load(businessId);
  }

  Future<void> refresh(String businessId) async {
    await _load(businessId, showLoading: false);
  }

  Future<void> _load(String businessId, {bool showLoading = true}) async {
    if (showLoading) emit(state.copyWith(loading: true, message: null));
    try {
      final now = DateTime.now();
      final day = DateTime(now.year, now.month, now.day);
      final date =
          '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
      final availability = await _venues.getAvailability(businessId, date);
      final rows = availability.bays.map((row) {
        final busy = row.busy;
        if (isFreeNow(day: day, duration: kDefaultSlotDuration, busy: busy, now: now)) {
          return BayAvailabilityRow(
            bay: row.bay,
            status: BayAvailabilityStatus.availableNow,
            nextSlot: now,
          );
        }
        final next = nextFreeStart(
          day: day,
          duration: kDefaultSlotDuration,
          busy: busy,
          now: now,
        );
        if (next != null) {
          return BayAvailabilityRow(
            bay: row.bay,
            status: BayAvailabilityStatus.busy,
            nextSlot: next,
          );
        }
        return BayAvailabilityRow(
          bay: row.bay,
          status: BayAvailabilityStatus.noSlotsToday,
        );
      }).toList();
      emit(state.copyWith(loading: false, rows: rows));
    } on Failure catch (error) {
      emit(state.copyWith(loading: false, message: error.message));
    }
  }
}
