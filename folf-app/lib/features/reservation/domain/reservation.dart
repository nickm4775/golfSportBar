class Reservation {
  const Reservation({
    required this.id,
    required this.businessId,
    required this.bayId,
    required this.startAt,
    required this.endAt,
    required this.status,
    required this.companionCount,
    required this.unitPriceBrl,
    required this.totalCostBrl,
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
  final int companionCount;
  final double unitPriceBrl;
  final double totalCostBrl;
  final String? notes;
  final String? bayName;
  final String? businessName;

  int get partySize => 1 + companionCount;

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
      companionCount: (json['companionCount'] as num?)?.toInt() ?? 0,
      unitPriceBrl: (json['unitPriceBrl'] as num?)?.toDouble() ?? 0,
      totalCostBrl: (json['totalCostBrl'] as num?)?.toDouble() ?? 0,
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
    required int companionCount,
    String? notes,
  });
  Future<Reservation> cancel(String id);
}
