import 'package:folf/core/network/api_client.dart';
import 'package:folf/features/venue/domain/venue.dart';

class VenueRepositoryImpl implements VenueRepository {
  VenueRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<Venue>> listVenues() async {
    final json = await _api.getList('/public/venues');
    return json.map((row) => Venue.fromJson(row as Map<String, dynamic>)).toList();
  }

  @override
  Future<MenuCatalog> getMenu(String businessId) async {
    final json = await _api.getMap('/public/venues/$businessId/menu');
    return MenuCatalog.fromJson(json);
  }

  @override
  Future<List<Bay>> listBays(String businessId) async {
    final json = await _api.getList('/public/venues/$businessId/bays');
    return json.map((row) => Bay.fromJson(row as Map<String, dynamic>)).toList();
  }

  @override
  Future<DayAvailability> getAvailability(String businessId, String date, {String? bayId}) async {
    final json = await _api.getMap(
      '/public/venues/$businessId/availability',
      query: {
        'date': date,
        'bayId': ?bayId,
      },
    );
    return DayAvailability.fromJson(json);
  }
}
