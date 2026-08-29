import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/reservation/presentation/bay_availability_cubit.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class BayAvailabilityPage extends StatefulWidget {
  const BayAvailabilityPage({super.key});

  @override
  State<BayAvailabilityPage> createState() => _BayAvailabilityPageState();
}

class _BayAvailabilityPageState extends State<BayAvailabilityPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final venue = context.read<VenueSessionCubit>().state.venue;
      if (venue != null) {
        context.read<BayAvailabilityCubit>().bootstrap(venue.id);
      }
    });
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
                          onReserve: row.status == BayAvailabilityStatus.noSlotsToday
                              ? null
                              : () => context.go('/app/reserve/book?bayId=${row.bay.id}'),
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
    final colors = Theme.of(context).colorScheme;
    final time = DateFormat.Hm();
    final (label, badgeColor, badgeFg) = switch (row.status) {
      BayAvailabilityStatus.availableNow => (
          l10n.bayAvailableNow,
          colors.primary.withValues(alpha: 0.14),
          colors.primary,
        ),
      BayAvailabilityStatus.busy => (
          l10n.bayBusyNow,
          colors.tertiary.withValues(alpha: 0.18),
          colors.tertiary,
        ),
      BayAvailabilityStatus.noSlotsToday => (
          l10n.bayNoSlotsToday,
          colors.onSurface.withValues(alpha: 0.08),
          colors.onSurface.withValues(alpha: 0.62),
        ),
    };

    return GsbCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  row.bay.name,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: badgeColor,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: badgeFg,
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
            ],
          ),
          if (row.status == BayAvailabilityStatus.busy && row.nextSlot != null) ...[
            const SizedBox(height: 8),
            Text(
              l10n.bayNextSlot(time.format(row.nextSlot!)),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.onSurface.withValues(alpha: 0.72),
                  ),
            ),
          ],
          if (onReserve != null) ...[
            const SizedBox(height: 14),
            FilledButton(
              onPressed: onReserve,
              child: Text(l10n.reserveThisBay),
            ),
          ],
        ],
      ),
    );
  }
}
