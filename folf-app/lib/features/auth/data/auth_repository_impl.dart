import 'package:folf/core/network/api_client.dart';
import 'package:folf/core/network/token_storage.dart';
import 'package:folf/features/auth/domain/auth.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._api, this._tokens);

  final ApiClient _api;
  final TokenStorage _tokens;

  @override
  Future<CustomerProfile> login(String identifier, String password) {
    return _authenticate('/auth/customers/login', {
      'identifier': identifier,
      'password': password,
    });
  }

  @override
  Future<CustomerProfile> register(RegisterPayload payload) {
    return _authenticate('/auth/customers/register', payload.toJson());
  }

  @override
  Future<CustomerProfile?> restore() async {
    final access = await _tokens.readAccess();
    if (access == null) return null;
    try {
      final json = await _api.getMap('/customers/me');
      return CustomerProfile.fromJson(json);
    } catch (_) {
      await _tokens.clear();
      return null;
    }
  }

  @override
  Future<void> logout() => _tokens.clear();

  Future<CustomerProfile> _authenticate(String path, Object data) async {
    final json = await _api.postMap(path, data: data);
    final tokens = AuthTokens.fromJson(json);
    await _tokens.save(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken);
    final me = await _api.getMap('/customers/me');
    return CustomerProfile.fromJson(me);
  }
}
