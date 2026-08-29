class Venue {
  const Venue({
    required this.id,
    required this.slug,
    required this.name,
    required this.address,
    required this.city,
    required this.state,
    required this.country,
    this.district,
    this.postalCode,
    this.lat,
    this.lng,
    this.timezone = 'America/Sao_Paulo',
  });

  final String id;
  final String slug;
  final String name;
  final String address;
  final String city;
  final String state;
  final String country;
  final String? district;
  final String? postalCode;
  final double? lat;
  final double? lng;
  final String timezone;

  String get fullAddress {
    final parts = [
      address,
      if (district != null && district!.isNotEmpty) district,
      '$city, $state',
    ];
    return parts.join(' · ');
  }

  factory Venue.fromJson(Map<String, dynamic> json) {
    return Venue(
      id: json['id'] as String,
      slug: json['slug'] as String? ?? '',
      name: json['name'] as String,
      address: json['address'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      country: json['country'] as String? ?? 'Brasil',
      district: json['district'] as String?,
      postalCode: json['postalCode'] as String?,
      lat: (json['lat'] as num?)?.toDouble(),
      lng: (json['lng'] as num?)?.toDouble(),
      timezone: json['timezone'] as String? ?? 'America/Sao_Paulo',
    );
  }
}

class MenuCategory {
  const MenuCategory({required this.id, required this.slug, required this.name});

  final String id;
  final String slug;
  final String name;

  factory MenuCategory.fromJson(Map<String, dynamic> json) {
    return MenuCategory(
      id: json['id'] as String,
      slug: json['slug'] as String? ?? '',
      name: (json['namePt'] ?? json['name'] ?? '') as String,
    );
  }
}

class MenuItem {
  const MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.priceBrl,
    required this.category,
    required this.featured,
    this.imageSrc,
  });

  final String id;
  final String name;
  final String description;
  final double priceBrl;
  final String category;
  final bool featured;
  final String? imageSrc;

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      priceBrl: (json['priceBrl'] as num).toDouble(),
      category: json['category'] as String? ?? '',
      featured: json['featured'] as bool? ?? false,
      imageSrc: json['imageSrc'] as String?,
    );
  }
}

class MenuCatalog {
  const MenuCatalog({required this.categories, required this.items});

  final List<MenuCategory> categories;
  final List<MenuItem> items;

  List<MenuItem> get featured => items.where((item) => item.featured).take(6).toList();

  factory MenuCatalog.fromJson(Map<String, dynamic> json) {
    return MenuCatalog(
      categories: (json['categories'] as List<dynamic>? ?? [])
          .map((row) => MenuCategory.fromJson(row as Map<String, dynamic>))
          .toList(),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((row) => MenuItem.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Bay {
  const Bay({required this.id, required this.code, required this.name});

  final String id;
  final String code;
  final String name;

  factory Bay.fromJson(Map<String, dynamic> json) {
    return Bay(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
    );
  }
}

class BusySlot {
  const BusySlot({required this.startAt, required this.endAt});

  final DateTime startAt;
  final DateTime endAt;

  factory BusySlot.fromJson(Map<String, dynamic> json) {
    return BusySlot(
      startAt: DateTime.parse(json['startAt'] as String).toLocal(),
      endAt: DateTime.parse(json['endAt'] as String).toLocal(),
    );
  }
}

class BayAvailability {
  const BayAvailability({
    required this.bay,
    required this.busy,
  });

  final Bay bay;
  final List<BusySlot> busy;
}

class DayAvailability {
  const DayAvailability({required this.date, required this.bays});

  final String date;
  final List<BayAvailability> bays;

  factory DayAvailability.fromJson(Map<String, dynamic> json) {
    return DayAvailability(
      date: json['date'] as String,
      bays: (json['bays'] as List<dynamic>? ?? []).map((row) {
        final map = row as Map<String, dynamic>;
        return BayAvailability(
          bay: Bay(
            id: map['id'] as String,
            code: map['code'] as String,
            name: map['name'] as String,
          ),
          busy: (map['busy'] as List<dynamic>? ?? [])
              .map((slot) => BusySlot.fromJson(slot as Map<String, dynamic>))
              .toList(),
        );
      }).toList(),
    );
  }
}

abstract class VenueRepository {
  Future<List<Venue>> listVenues();
  Future<MenuCatalog> getMenu(String businessId);
  Future<List<Bay>> listBays(String businessId);
  Future<DayAvailability> getAvailability(String businessId, String date, {String? bayId});
}
