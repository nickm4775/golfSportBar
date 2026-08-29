import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/app/shell.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/features/auth/presentation/login_page.dart';
import 'package:folf/features/auth/presentation/register_page.dart';
import 'package:folf/features/home/presentation/home_page.dart';
import 'package:folf/features/map/presentation/map_page.dart';
import 'package:folf/features/order/presentation/order_cubit.dart';
import 'package:folf/features/order/presentation/order_history_page.dart';
import 'package:folf/features/order/presentation/order_page.dart';
import 'package:folf/features/qr/presentation/qr_cubit.dart';
import 'package:folf/features/qr/presentation/qr_page.dart';
import 'package:folf/features/reservation/presentation/bay_availability_cubit.dart';
import 'package:folf/features/reservation/presentation/bay_availability_page.dart';
import 'package:folf/features/reservation/presentation/reservation_cubit.dart';
import 'package:folf/features/reservation/presentation/reservation_page.dart';
import 'package:folf/injection.dart';
import 'package:go_router/go_router.dart';

class GoRouterRefresh extends ChangeNotifier {
  GoRouterRefresh(AuthBloc bloc) {
    _sub = bloc.stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

GoRouter createRouter(AuthBloc authBloc) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: GoRouterRefresh(authBloc),
    redirect: (context, state) {
      final auth = authBloc.state;
      final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      final splashing = state.matchedLocation == '/splash';
      if (auth is AuthUnknown) return splashing ? null : '/splash';
      if (auth is AuthLoading) {
        if (loggingIn || splashing) return null;
        return '/splash';
      }
      if (auth is AuthUnauthenticated) return loggingIn ? null : '/login';
      if (auth is AuthAuthenticated && (loggingIn || splashing)) return '/app/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashPage()),
      GoRoute(path: '/login', builder: (context, state) => const LoginPage()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterPage()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MultiBlocProvider(
          providers: [
            BlocProvider(create: (_) => sl<CartCubit>()),
            BlocProvider(create: (_) => sl<OrderCubit>()),
          ],
          child: AppShell(navigationShell: navigationShell),
        ),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/app/home', builder: (context, state) => const HomePage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/app/map', builder: (context, state) => const MapPage()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/app/qr',
              builder: (context, state) => BlocProvider(
                create: (_) => sl<QrCubit>(),
                child: const QrPage(),
              ),
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/app/reserve',
              builder: (context, state) => BlocProvider(
                create: (_) => sl<BayAvailabilityCubit>(),
                child: const BayAvailabilityPage(),
              ),
              routes: [
                GoRoute(
                  path: 'book',
                  builder: (context, state) {
                    final bayId = state.uri.queryParameters['bayId'];
                    return BlocProvider(
                      create: (_) => sl<ReservationCubit>()..setInitialBayId(bayId),
                      child: const ReservationPage(),
                    );
                  },
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/app/order',
              builder: (context, state) => const OrderPage(),
              routes: [
                GoRoute(
                  path: 'history',
                  builder: (context, state) => const OrderHistoryPage(),
                ),
              ],
            ),
          ]),
        ],
      ),
    ],
  );
}

class SplashPage extends StatelessWidget {
  const SplashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const GsbScaffold(
      body: Center(child: GsbLogo()),
    );
  }
}
