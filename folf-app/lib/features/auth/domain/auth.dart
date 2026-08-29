class CustomerProfile {
  const CustomerProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.cpf,
  });

  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String cpf;

  String get firstName => fullName.split(' ').first;

  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+')).where((part) => part.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first[0] + parts.last[0]).toUpperCase();
  }

  factory CustomerProfile.fromJson(Map<String, dynamic> json) {
    return CustomerProfile(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String? ?? '',
      cpf: json['cpf'] as String? ?? '',
    );
  }
}

class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken, required this.expiresIn});

  final String accessToken;
  final String refreshToken;
  final int expiresIn;

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      expiresIn: (json['expiresIn'] as num?)?.toInt() ?? 900,
    );
  }
}

class RegisterPayload {
  const RegisterPayload({
    required this.fullName,
    required this.cpf,
    required this.email,
    required this.phone,
    required this.birthDate,
    required this.password,
    required this.lgpdAccepted,
    this.postalCode,
    this.street,
    this.streetNumber,
    this.complement,
    this.district,
    this.city,
    this.state,
  });

  final String fullName;
  final String cpf;
  final String email;
  final String phone;
  final String birthDate;
  final String password;
  final bool lgpdAccepted;
  final String? postalCode;
  final String? street;
  final String? streetNumber;
  final String? complement;
  final String? district;
  final String? city;
  final String? state;

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'cpf': cpf,
        'email': email,
        'phone': phone,
        'birthDate': birthDate,
        'password': password,
        'lgpdAccepted': lgpdAccepted,
        if (postalCode != null && postalCode!.isNotEmpty) 'postalCode': postalCode,
        if (street != null && street!.isNotEmpty) 'street': street,
        if (streetNumber != null && streetNumber!.isNotEmpty) 'streetNumber': streetNumber,
        if (complement != null && complement!.isNotEmpty) 'complement': complement,
        if (district != null && district!.isNotEmpty) 'district': district,
        if (city != null && city!.isNotEmpty) 'city': city,
        if (state != null && state!.isNotEmpty) 'state': state,
      };
}

abstract class AuthRepository {
  Future<CustomerProfile> login(String identifier, String password);
  Future<CustomerProfile> register(RegisterPayload payload);
  Future<CustomerProfile?> restore();
  Future<void> logout();
}
