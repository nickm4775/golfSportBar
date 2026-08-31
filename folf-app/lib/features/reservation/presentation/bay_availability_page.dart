import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/reservation/presentation/bay_availability_cubit.dart';
import 'package:folf/features/reservation/presentation/widgets/bay_option_card.dart';
import 'package:folf/features/reservation/presentation/widgets/bay_status_style.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class BayAvailabilityPage extends StatefulWidget {
  const BayAvailabilityPage({super.key});

  @override
  State<BayAvailabilityPage> createState() => _BayAvailabilityPageState();
}

class _BayAvailabilityPageState extends State<BayAvailabilityPage> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final venue = context.read<VenueSessionCubit>().state.venue;
      if (venue != null) {
        context.read<BayAvailabilityCubit>().bootstrap(venue.id);
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_refresh());
    }
  }

  Future<void> _refresh() async {
    final venue = context.read<VenueSessionCubit>().state.venue;
    if (venue != null) {
      await context.read<BayAvailabilityCubit>().refresh(venue.id);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final venue = context.watch<VenueSessionCubit>().state.venue;
    if (venue == null) {
      return GsbScaffold(body: Center(child: Text(l10n.noVenues)));
    }

    return GsbScaffold(
      body: BlocBuilder<BayAvailabilityCubit, BayAvailabilityViewState>(
        builder: (context, state) {
          if (state.loading && state.rows.isEmpty) return const GsbLoading();
          if (state.message != null && state.rows.isEmpty) {
            return GsbError(
              message: state.message!.isEmpty ? l10n.errorGeneric : state.message!,
              onRetry: _refresh,
              retryLabel: l10n.retry,
            );
          }

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              padding: const EdgeInsets.only(bottom: 120),
              children: [
                Text(
                  l10n.bayAvailabilityTitle,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.viewAllBays,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.72),
                      ),
                ),
                const SizedBox(height: 20),
                if (state.rows.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 48),
                    child: Center(child: Text(l10n.noSlots)),
                  )
                else
                  ...state.rows.map((row) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _BayCard(
                          row: row,
                          l10n: l10n,
                          onReserve: row.canReserve
                              ? () => context.go('/app/reserve/book?bayId=${row.bay.id}')
                              : null,
                        ),
                      )),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BayCard extends StatelessWidget {
  const _BayCard({
    required this.row,
    required this.l10n,
    this.onReserve,
  });

  final BayAvailabilityRow row;
  final AppLocalizations l10n;
  final VoidCallback? onReserve;

  @override
  Widget build(BuildContext context) {
    final style = bayStatusStyle(context: context, l10n: l10n, status: row.status);

    return BayOptionCard(
      name: row.bay.name,
      badgeLabel: style.label,
      badgeColor: style.badgeColor,
      badgeForeground: style.badgeForeground,
      accentColor: style.accent,
      onTap: onReserve,
      action: onReserve == null
          ? null
          : FilledButton(
              onPressed: onReserve,
              child: Text(l10n.reserveThisBay),
            ),
    );
  }
}
