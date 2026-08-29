import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/app/router.dart';
import 'package:folf/core/theme/gsb_theme.dart';
import 'package:folf/core/theme/theme_cubit.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/features/home/presentation/home_cubit.dart';
import 'package:folf/features/notifications/notifications_cubit.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/injection.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class FolfApp extends StatefulWidget {
  const FolfApp({super.key});

  @override
  State<FolfApp> createState() => _FolfAppState();
}

class _FolfAppState extends State<FolfApp> {
  late final AuthBloc _authBloc;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authBloc = sl<AuthBloc>();
    _router = createRouter(_authBloc);
    _authBloc.add(const AuthHydrated());
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider.value(value: sl<ThemeCubit>()),
        BlocProvider.value(value: sl<LocaleCubit>()),
        BlocProvider.value(value: sl<VenueSessionCubit>()),
        BlocProvider.value(value: sl<HomeCubit>()),
        BlocProvider.value(value: sl<NotificationsCubit>()),
      ],
      child: BlocBuilder<ThemeCubit, ThemeMode>(
        builder: (context, themeMode) {
          return BlocBuilder<LocaleCubit, Locale>(
            builder: (context, locale) {
              return MaterialApp.router(
                title: 'Golf Sport Bar',
                debugShowCheckedModeBanner: false,
                theme: GsbTheme.light(),
                darkTheme: GsbTheme.dark(),
                themeMode: themeMode,
                locale: locale,
                supportedLocales: AppLocalizations.supportedLocales,
                localizationsDelegates: AppLocalizations.localizationsDelegates,
                routerConfig: _router,
              );
            },
          );
        },
      ),
    );
  }
}
