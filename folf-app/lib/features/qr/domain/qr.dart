class QrResult {
  const QrResult({
    required this.kind,
    required this.raw,
    this.businessId,
    this.tableLabel,
    this.reservationId,
    this.url,
  });

  final String kind;
  final String raw;
  final String? businessId;
  final String? tableLabel;
  final String? reservationId;
  final String? url;

  factory QrResult.fromJson(Map<String, dynamic> json) {
    return QrResult(
      kind: json['kind'] as String,
      raw: json['raw'] as String? ?? '',
      businessId: json['businessId'] as String?,
      tableLabel: json['tableLabel'] as String?,
      reservationId: json['reservationId'] as String?,
      url: json['url'] as String?,
    );
  }
}

abstract class QrRepository {
  Future<QrResult> resolve(String payload);
}
