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
      realtimeWsUrl: realtimeOverride.isNotEmpty ? realtimeOverride : realtimeWsFromApi(apiBaseUrl),
    );
  }
}

String realtimeWsFromApi(String apiBaseUrl) {
  final uri = Uri.parse(apiBaseUrl);
  final scheme = uri.scheme == 'https' ? 'wss' : 'ws';
  return '$scheme://${uri.host}:8000/connection/websocket';
}
