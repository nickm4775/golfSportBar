import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/reservation/domain/bay_live_status.dart';
import 'package:folf/features/venue/domain/venue.dart';

class BayAvailabilityRow extends Equatable {
  const BayAvailabilityRow({
    required this.bay,
    required this.status,
    required this.canReserve,
  });

  final Bay bay;
  final BayLiveStatus status;
  final bool canReserve;

  @override
  List<Object?> get props => [bay.id, status, canReserve];
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
  Timer? _refreshTimer;
  String? _businessId;

  Future<void> bootstrap(String businessId) async {
    _businessId = businessId;
    emit(state.copyWith(loading: true, message: null));
    await _load(businessId);
    _startLiveRefresh();
  }

  Future<void> refresh(String businessId) async {
    _businessId = businessId;
    await _load(businessId, showLoading: false);
  }

  void _startLiveRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(kBayStatusRefreshInterval, (_) {
      final businessId = _businessId;
      if (businessId != null) {
        unawaited(_load(businessId, showLoading: false));
      }
    });
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
        return BayAvailabilityRow(
          bay: row.bay,
          status: resolveBayLiveStatus(busy: busy, now: now),
          canReserve: bayCanReserveToday(busy: busy, now: now),
        );
      }).toList();
      emit(state.copyWith(loading: false, rows: rows));
    } on Failure catch (error) {
      emit(state.copyWith(loading: false, message: error.message));
    }
  }

  @override
  Future<void> close() {
    _refreshTimer?.cancel();
    return super.close();
  }
}
