import 'package:folf/core/config/app_config.dart';
import 'package:folf/core/network/api_client.dart';
import 'package:folf/core/network/token_storage.dart';
import 'package:folf/core/realtime/customer_realtime_client.dart';
import 'package:folf/core/theme/theme_cubit.dart';
import 'package:folf/features/auth/data/auth_repository_impl.dart';
import 'package:folf/features/auth/domain/auth.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/features/home/presentation/home_cubit.dart';
import 'package:folf/features/notifications/notifications_cubit.dart';
import 'package:folf/features/order/data/order_repository_impl.dart';
import 'package:folf/features/order/domain/order.dart';
import 'package:folf/features/order/presentation/order_cubit.dart';
import 'package:folf/features/qr/data/qr_repository_impl.dart';
import 'package:folf/features/qr/domain/qr.dart';
import 'package:folf/features/qr/presentation/qr_cubit.dart';
import 'package:folf/features/reservation/data/reservation_repository_impl.dart';
import 'package:folf/features/reservation/domain/reservation.dart';
import 'package:folf/features/reservation/presentation/bay_availability_cubit.dart';
import 'package:folf/features/reservation/presentation/reservation_cubit.dart';
import 'package:folf/features/venue/data/venue_repository_impl.dart';
import 'package:folf/features/venue/domain/venue.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sl = GetIt.instance;

Future<void> configureDependencies() async {
  final prefs = await SharedPreferences.getInstance();
  sl.registerSingleton(prefs);
  sl.registerSingleton(AppConfig.fromEnvironment());
  sl.registerSingleton(TokenStorage());
  sl.registerSingleton(ApiClient(config: sl(), tokenStorage: sl()));
  sl.registerLazySingleton(() => CustomerRealtimeClient(sl(), sl()));

  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(sl(), sl()));
  sl.registerLazySingleton<VenueRepository>(() => VenueRepositoryImpl(sl()));
  sl.registerLazySingleton<QrRepository>(() => QrRepositoryImpl(sl()));
  sl.registerLazySingleton<ReservationRepository>(() => ReservationRepositoryImpl(sl()));
  sl.registerLazySingleton<OrderRepository>(() => OrderRepositoryImpl(sl()));

  sl.registerLazySingleton(() => ThemeCubit(sl()));
  sl.registerLazySingleton(() => LocaleCubit(sl()));
  sl.registerLazySingleton(() => VenueSessionCubit(sl()));
  sl.registerLazySingleton(() => AuthBloc(sl()));
  sl.registerLazySingleton(() => NotificationsCubit(sl<AuthBloc>()));
  sl.registerLazySingleton(
    () => HomeCubit(venues: sl(), reservations: sl(), orders: sl()),
  );
  sl.registerFactory(() => QrCubit(sl()));
  sl.registerFactory(() => BayAvailabilityCubit(venues: sl()));
  sl.registerFactory(() => ReservationCubit(venues: sl(), reservations: sl()));
  sl.registerFactory(() => OrderCubit(venues: sl(), orders: sl()));
  sl.registerFactory(CartCubit.new);
}
