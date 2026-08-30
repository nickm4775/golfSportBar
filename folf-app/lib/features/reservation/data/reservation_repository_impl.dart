import 'package:folf/core/network/api_client.dart';
import 'package:folf/features/reservation/domain/reservation.dart';

class ReservationRepositoryImpl implements ReservationRepository {
  ReservationRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<Reservation>> listMine() async {
    final json = await _api.getList('/me/reservations');
    return json.map((row) => Reservation.fromJson(row as Map<String, dynamic>)).toList();
  }

  @override
  Future<Reservation> getById(String id) async {
    final json = await _api.getMap('/me/reservations/$id');
    return Reservation.fromJson(json);
  }

  @override
  Future<Reservation> create({
    required String businessId,
    required String bayId,
    required DateTime startAt,
    required DateTime endAt,
    required int companionCount,
    String? notes,
  }) async {
    final json = await _api.postMap(
      '/me/venues/$businessId/reservations',
      data: {
        'bayId': bayId,
        'startAt': startAt.toUtc().toIso8601String(),
        'endAt': endAt.toUtc().toIso8601String(),
        'companionCount': companionCount,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    return Reservation.fromJson(json);
  }

  @override
  Future<Reservation> cancel(String id) async {
    final json = await _api.postMap('/me/reservations/$id/cancel');
    return Reservation.fromJson(json);
  }
}
