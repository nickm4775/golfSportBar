import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/qr/domain/qr.dart';

class QrState extends Equatable {
  const QrState({this.busy = false, this.result, this.message});

  final bool busy;
  final QrResult? result;
  final String? message;

  @override
  List<Object?> get props => [busy, result, message];
}

class QrCubit extends Cubit<QrState> {
  QrCubit(this._repository) : super(const QrState());

  final QrRepository _repository;
  String? _last;

  Future<void> scan(String payload) async {
    if (payload == _last || state.busy) return;
    _last = payload;
    emit(const QrState(busy: true));
    try {
      final result = await _repository.resolve(payload);
      emit(QrState(result: result));
    } on Failure catch (error) {
      emit(QrState(message: error.message));
    } catch (_) {
      emit(const QrState(message: 'Não foi possível ler o QR.'));
    }
  }

  void clear() {
    _last = null;
    emit(const QrState());
  }
}
