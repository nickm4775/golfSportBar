import 'dart:async';
import 'dart:convert';

import 'package:centrifuge/centrifuge.dart';
import 'package:folf/core/config/app_config.dart';
import 'package:folf/core/network/api_client.dart';

class OrderRealtimeEvent {
  const OrderRealtimeEvent({required this.type, this.entityId, this.status});

  final String type;
  final String? entityId;
  final String? status;

  bool get isCompleted => type == 'order.changed' && status == 'COMPLETED';
}

class CustomerRealtimeClient {
  CustomerRealtimeClient(this._api, this._config);

  final ApiClient _api;
  final AppConfig _config;

  Client? _client;
  StreamSubscription<ServerPublicationEvent>? _publicationSub;
  bool _connecting = false;

  final _events = StreamController<OrderRealtimeEvent>.broadcast();

  Stream<OrderRealtimeEvent> get events => _events.stream;

  Future<void> connect() async {
    if (_client != null || _connecting) return;
    _connecting = true;
    try {
      final tokenPayload = await _api.getMap('/me/realtime/token');
      final token = tokenPayload['token'] as String?;
      if (token == null || token.isEmpty) return;

      final client = createClient(
        _config.realtimeWsUrl,
        ClientConfig(
          token: token,
          getToken: (_) async {
            final next = await _api.getMap('/me/realtime/token');
            return next['token'] as String? ?? '';
          },
        ),
      );

      _publicationSub = client.publication.listen(_onPublication);
      await client.connect();
      _client = client;
    } catch (_) {
      await disconnect();
    } finally {
      _connecting = false;
    }
  }

  void _onPublication(ServerPublicationEvent event) {
    try {
      final decoded = jsonDecode(utf8.decode(event.data));
      if (decoded is! Map) return;
      final type = decoded['type'];
      if (type is! String) return;
      _events.add(
        OrderRealtimeEvent(
          type: type,
          entityId: decoded['entityId'] as String?,
          status: decoded['status'] as String?,
        ),
      );
    } catch (_) {}
  }

  Future<void> disconnect() async {
    await _publicationSub?.cancel();
    _publicationSub = null;
    try {
      await _client?.disconnect();
    } catch (_) {}
    _client = null;
  }
}
