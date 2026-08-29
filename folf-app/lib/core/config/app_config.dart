class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.menuAssetBaseUrl,
    required this.instagramUrl,
    required this.whatsappUrl,
    required this.realtimeWsUrl,
  });

  final String apiBaseUrl;
  final String menuAssetBaseUrl;
  final String instagramUrl;
  final String whatsappUrl;
  final String realtimeWsUrl;

  factory AppConfig.fromEnvironment() {
    const apiBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://127.0.0.1:3000/api/v1',
    );
    const realtimeOverride = String.fromEnvironment('REALTIME_WS_URL');
    return AppConfig(
      apiBaseUrl: apiBaseUrl,
      menuAssetBaseUrl: const String.fromEnvironment(
        'MENU_ASSET_BASE_URL',
        defaultValue: 'http://127.0.0.1:5173',
      ),
      instagramUrl: 'https://www.instagram.com/golfsportbarbc/',
      whatsappUrl: 'https://wa.me/5547960001878',
      realtimeWsUrl: realtimeOverride.isNotEmpty
          ? realtimeOverride
          : realtimeWsFromApi(apiBaseUrl),
    );
  }
}

/// Deriva el WebSocket de Centrifugo a partir de la URL de la API.
///
/// - Dev (`http://host:3000/...`): Centrifugo en el puerto `8000`.
/// - Prod detrás de Caddy (`https://golfsportbar.com.br/...`): mismo host,
///   sin puerto extra → `wss://dominio/connection/websocket`.
String realtimeWsFromApi(String apiBaseUrl) {
  final uri = Uri.parse(apiBaseUrl);
  final scheme = uri.scheme == 'https' ? 'wss' : 'ws';
  final useDevCentrifugoPort =
      uri.hasPort && uri.port != 80 && uri.port != 443;
  final authority =
      useDevCentrifugoPort ? '${uri.host}:8000' : uri.host;
  return '$scheme://$authority/connection/websocket';
}
