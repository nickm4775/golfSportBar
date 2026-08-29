class Reservation {
  const Reservation({
    required this.id,
    required this.businessId,
    required this.bayId,
    required this.startAt,
    required this.endAt,
    required this.status,
    this.notes,
    this.bayName,
    this.businessName,
  });

  final String id;
  final String businessId;
  final String bayId;
  final DateTime startAt;
  final DateTime endAt;
  final String status;
  final String? notes;
  final String? bayName;
  final String? businessName;

  bool get canCancel => status == 'PENDING' || status == 'CONFIRMED';

  factory Reservation.fromJson(Map<String, dynamic> json) {
    final bay = json['bay'] as Map<String, dynamic>?;
    final business = json['business'] as Map<String, dynamic>?;
    return Reservation(
      id: json['id'] as String,
      businessId: json['businessId'] as String,
      bayId: json['bayId'] as String,
      startAt: DateTime.parse(json['startAt'] as String).toLocal(),
      endAt: DateTime.parse(json['endAt'] as String).toLocal(),
      status: json['status'] as String,
      notes: json['notes'] as String?,
      bayName: bay?['name'] as String? ?? bay?['code'] as String?,
      businessName: business?['name'] as String?,
    );
  }
}

abstract class ReservationRepository {
  Future<List<Reservation>> listMine();
  Future<Reservation> getById(String id);
  Future<Reservation> create({
    required String businessId,
    required String bayId,
    required DateTime startAt,
    required DateTime endAt,
    String? notes,
  });
  Future<Reservation> cancel(String id);
}
