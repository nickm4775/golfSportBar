import 'package:dio/dio.dart';
import 'package:folf/core/config/app_config.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/core/network/token_storage.dart';

class ApiClient {
  ApiClient({
    required AppConfig config,
    required TokenStorage tokenStorage,
    Dio? dio,
  })  : _tokenStorage = tokenStorage,
        _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: config.apiBaseUrl,
                connectTimeout: const Duration(seconds: 12),
                receiveTimeout: const Duration(seconds: 20),
                headers: const {'Content-Type': 'application/json'},
              ),
            ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStorage.readAccess();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final status = error.response?.statusCode;
          final path = error.requestOptions.path;
          final isAuthCall = path.contains('/auth/customers/');
          if (status != 401 || isAuthCall || error.requestOptions.extra['retried'] == true) {
            handler.next(error);
            return;
          }

          try {
            final refreshed = await _refresh();
            if (!refreshed) {
              handler.next(error);
              return;
            }
            final token = await _tokenStorage.readAccess();
            final opts = error.requestOptions;
            opts.headers['Authorization'] = 'Bearer $token';
            opts.extra['retried'] = true;
            final response = await _dio.fetch(opts);
            handler.resolve(response);
          } catch (_) {
            handler.next(error);
          }
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStorage _tokenStorage;
  bool _refreshing = false;

  Future<Map<String, dynamic>> getMap(String path, {Map<String, dynamic>? query}) async {
    final data = await get<dynamic>(path, query: query);
    return Map<String, dynamic>.from(data as Map);
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final data = await get<dynamic>(path, query: query);
    return List<dynamic>.from(data as List);
  }

  Future<Map<String, dynamic>> postMap(String path, {Object? data}) async {
    final body = await post<dynamic>(path, data: data);
    return Map<String, dynamic>.from(body as Map);
  }

  Future<T> get<T>(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await _dio.get<T>(path, queryParameters: query);
      return response.data as T;
    } on DioException catch (error) {
      throw _map(error);
    }
  }

  Future<T> post<T>(String path, {Object? data}) async {
    try {
      final response = await _dio.post<T>(path, data: data);
      return response.data as T;
    } on DioException catch (error) {
      throw _map(error);
    }
  }

  Failure _map(DioException error) {
    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      final message = data['message'];
      final text = message is List ? message.join('\n') : message.toString();
      final status = error.response?.statusCode;
      if (status == 401) {
        return AuthFailure(text, code: data['code'] as String?, statusCode: status);
      }
      return NetworkFailure(text, code: data['code'] as String?, statusCode: status);
    }
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout) {
      return const NetworkFailure('Sem conexão com o servidor.');
    }
    return NetworkFailure(error.message ?? 'Erro de rede');
  }

  Future<bool> _refresh() async {
    if (_refreshing) return false;
    _refreshing = true;
    try {
      final refresh = await _tokenStorage.readRefresh();
      if (refresh == null || refresh.isEmpty) return false;
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/customers/refresh',
        data: {'refreshToken': refresh},
        options: Options(extra: {'retried': true}),
      );
      final body = response.data;
      final access = body?['accessToken'] as String?;
      final nextRefresh = body?['refreshToken'] as String?;
      if (access == null || nextRefresh == null) return false;
      await _tokenStorage.save(accessToken: access, refreshToken: nextRefresh);
      return true;
    } catch (_) {
      await _tokenStorage.clear();
      return false;
    } finally {
      _refreshing = false;
    }
  }
}
