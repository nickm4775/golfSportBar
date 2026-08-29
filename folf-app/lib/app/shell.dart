import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/app/top_bar.dart';
import 'package:folf/core/realtime/customer_realtime_client.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/home/presentation/home_cubit.dart';
import 'package:folf/features/notifications/notifications_cubit.dart';
import 'package:folf/features/order/presentation/order_cubit.dart';
import 'package:folf/injection.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final navBrightness = theme.brightness == Brightness.dark ? Brightness.light : Brightness.dark;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarIconBrightness: navBrightness,
        systemNavigationBarContrastEnforced: false,
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: navBrightness,
      ),
      child: _RealtimeHost(
        child: Scaffold(
          body: Column(
            children: [
              const SafeArea(bottom: false, child: GsbTopBar()),
              Expanded(child: navigationShell),
              GsbTabBar(
                index: navigationShell.currentIndex,
                tooltips: [l10n.tabHome, l10n.tabMap, l10n.tabQr, l10n.tabReserve, l10n.tabOrder],
                onTap: (index) {
                  navigationShell.goBranch(
                    index,
                    initialLocation: index == navigationShell.currentIndex,
                  );
                  if (index == 4) context.read<OrderCubit>().refreshOrders();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RealtimeHost extends StatefulWidget {
  const _RealtimeHost({required this.child});

  final Widget child;

  @override
  State<_RealtimeHost> createState() => _RealtimeHostState();
}

class _RealtimeHostState extends State<_RealtimeHost> {
  StreamSubscription<OrderRealtimeEvent>? _events;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bind());
  }

  Future<void> _bind() async {
    final client = sl<CustomerRealtimeClient>();
    _events = client.events.listen(_onEvent);
    await client.connect();
  }

  void _onEvent(OrderRealtimeEvent event) {
    if (event.type != 'order.changed') return;
    context.read<HomeCubit>().refreshOrders();
    context.read<OrderCubit>().refreshOrders();
    if (!event.isCompleted || !mounted) return;
    context.read<NotificationsCubit>().pushOrderReady(orderId: event.entityId);
  }

  @override
  void dispose() {
    _events?.cancel();
    unawaited(sl<CustomerRealtimeClient>().disconnect());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
