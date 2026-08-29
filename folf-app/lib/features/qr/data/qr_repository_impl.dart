import 'package:folf/core/network/api_client.dart';
import 'package:folf/features/qr/domain/qr.dart';

class QrRepositoryImpl implements QrRepository {
  QrRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<QrResult> resolve(String payload) async {
    final json = await _api.postMap(
      '/public/qr/resolve',
      data: {'payload': payload},
    );
    return QrResult.fromJson(json);
  }
}
