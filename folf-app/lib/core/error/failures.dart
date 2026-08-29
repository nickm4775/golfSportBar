class Failure implements Exception {
  const Failure(this.message, {this.code, this.statusCode});

  final String message;
  final String? code;
  final int? statusCode;

  @override
  String toString() => message;
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, {super.code, super.statusCode});
}

class NetworkFailure extends Failure {
  const NetworkFailure(super.message, {super.code, super.statusCode});
}
