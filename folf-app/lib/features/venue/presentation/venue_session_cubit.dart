import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/features/venue/domain/venue.dart';
import 'package:shared_preferences/shared_preferences.dart';

class VenueSessionState extends Equatable {
  const VenueSessionState({this.venue, this.tableLabel});

  final Venue? venue;
  final String? tableLabel;

  VenueSessionState copyWith({Venue? venue, String? tableLabel, bool clearTable = false}) {
    return VenueSessionState(
      venue: venue ?? this.venue,
      tableLabel: clearTable ? null : (tableLabel ?? this.tableLabel),
    );
  }

  @override
  List<Object?> get props => [venue?.id, tableLabel];
}

class VenueSessionCubit extends Cubit<VenueSessionState> {
  VenueSessionCubit(this._prefs) : super(const VenueSessionState());

  final SharedPreferences _prefs;
  static const _venueIdKey = 'gsb-venue-id';
  static const _tableKey = 'gsb-table-label';

  Future<void> hydrate(List<Venue> venues) async {
    final savedId = _prefs.getString(_venueIdKey);
    final table = _prefs.getString(_tableKey);
    Venue? venue;
    if (savedId != null) {
      for (final item in venues) {
        if (item.id == savedId) venue = item;
      }
    }
    venue ??= venues.isNotEmpty ? venues.first : null;
    emit(VenueSessionState(venue: venue, tableLabel: table));
  }

  Future<void> selectVenue(Venue venue, {String? tableLabel}) async {
    await _prefs.setString(_venueIdKey, venue.id);
    if (tableLabel != null && tableLabel.isNotEmpty) {
      await _prefs.setString(_tableKey, tableLabel);
      emit(VenueSessionState(venue: venue, tableLabel: tableLabel));
      return;
    }
    if (state.venue?.id != venue.id) {
      await _prefs.remove(_tableKey);
      emit(VenueSessionState(venue: venue));
      return;
    }
    emit(state.copyWith(venue: venue));
  }

  Future<void> setTable(String label) async {
    await _prefs.setString(_tableKey, label);
    emit(state.copyWith(tableLabel: label));
  }

  Future<void> clearTable() async {
    await _prefs.remove(_tableKey);
    emit(state.copyWith(clearTable: true));
  }
}
