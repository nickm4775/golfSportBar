import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/format/brl.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/reservation/domain/reservation.dart';
import 'package:folf/features/reservation/presentation/reservation_cubit.dart';
import 'package:folf/features/reservation/presentation/widgets/bay_option_card.dart';
import 'package:folf/features/reservation/presentation/widgets/bay_status_style.dart';
import 'package:folf/features/reservation/presentation/widgets/duration_stepper.dart';
import 'package:folf/features/reservation/presentation/widgets/reservation_price_summary.dart';
import 'package:folf/features/reservation/presentation/widgets/time_slot_picker.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class ReservationPage extends StatefulWidget {
  const ReservationPage({super.key});

  @override
  State<ReservationPage> createState() => _ReservationPageState();
}

class _ReservationPageState extends State<ReservationPage> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final venue = context.read<VenueSessionCubit>().state.venue;
      if (venue != null) context.read<ReservationCubit>().bootstrap(venue.id);
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tabs.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final venue = context.read<VenueSessionCubit>().state.venue;
      if (venue != null) {
        unawaited(context.read<ReservationCubit>().refreshAvailability(venue.id));
      }
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
      body: BlocConsumer<ReservationCubit, ReservationViewState>(
        listenWhen: (previous, current) =>
            current.message != previous.message || current.created?.id != previous.created?.id,
        listener: (context, state) {
          if (state.message != null) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message!)));
          }
          if (state.created != null) {
            _tabs.animateTo(1);
          }
        },
        builder: (context, state) {
          if (state.loading) return const GsbLoading();
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => context.go('/app/reserve'),
                    icon: const Icon(Icons.arrow_back),
                    tooltip: l10n.back,
                  ),
                  Expanded(
                    child: Text(l10n.reservationTitle, style: Theme.of(context).textTheme.headlineMedium),
                  ),
                ],
              ),
              TabBar(
                controller: _tabs,
                tabs: [
                  Tab(text: l10n.newReservation),
                  Tab(text: l10n.myReservations),
                ],
              ),
              Expanded(
                child: TabBarView(
                  controller: _tabs,
                  children: [
                    _NewReservation(venueId: venue.id, l10n: l10n, state: state),
                    _MyReservations(l10n: l10n, items: state.mine),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _NewReservation extends StatelessWidget {
  const _NewReservation({required this.venueId, required this.l10n, required this.state});

  final String venueId;
  final AppLocalizations l10n;
  final ReservationViewState state;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<ReservationCubit>();
    final slots = cubit.freeStarts();
    final hasBay = state.selectedBayId != null;
    final durationHours = state.duration.inHours;

    return ListView(
      padding: const EdgeInsets.only(top: 16, bottom: 120),
      children: [
        Text(l10n.pickBay, style: Theme.of(context).textTheme.titleSmall),
        const SizedBox(height: 10),
        for (final bay in state.bays) ...[
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Builder(
              builder: (context) {
                final liveStatus = cubit.liveStatusForBay(bay.id);
                final style = liveStatus == null
                    ? null
                    : bayStatusStyle(context: context, l10n: l10n, status: liveStatus);
                return BayOptionCard(
                  name: bay.name,
                  selected: bay.id == state.selectedBayId,
                  badgeLabel: style?.label,
                  badgeColor: style?.badgeColor,
                  badgeForeground: style?.badgeForeground,
                  accentColor: style?.accent,
                  onTap: () => cubit.selectBay(venueId, bay.id),
                );
              },
            ),
          ),
        ],
        const SizedBox(height: 8),
        ListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(l10n.pickDay),
          subtitle: Text(state.day == null ? '' : DateFormat.yMMMd().format(state.day!)),
          trailing: const Icon(Icons.calendar_today_outlined),
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: state.day ?? DateTime.now(),
              firstDate: DateTime.now(),
              lastDate: DateTime.now().add(const Duration(days: 60)),
            );
            if (picked != null) cubit.selectDay(venueId, picked);
          },
        ),
        if (hasBay) ...[
          const SizedBox(height: 8),
          Text(l10n.duration, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 10),
          DurationStepper(
            hours: durationHours,
            onChanged: (hours) => cubit.selectDuration(Duration(hours: hours)),
          ),
          const SizedBox(height: 16),
          Text(l10n.companions, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              for (final count in [0, 1, 2, 3])
                GsbChip(
                  label: '$count',
                  selected: state.companionCount == count,
                  onTap: () => cubit.selectCompanions(count),
                ),
            ],
          ),
          const SizedBox(height: 16),
          ReservationPriceSummary(
            companionCount: state.companionCount,
            durationHours: durationHours,
          ),
          const SizedBox(height: 16),
          Text(l10n.pickStartTime, style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 10),
          TimeSlotPicker(
            slots: slots,
            duration: state.duration,
            selectedStart: state.selectedStart,
            onSelected: cubit.selectStart,
          ),
        ],
        const SizedBox(height: 24),
        FilledButton(
          onPressed: state.submitting || state.selectedStart == null
              ? null
              : () => cubit.submit(venueId),
          child: Text(l10n.confirmBooking),
        ),
      ],
    );
  }
}

class _MyReservations extends StatelessWidget {
  const _MyReservations({required this.l10n, required this.items});

  final AppLocalizations l10n;
  final List<Reservation> items;

  String _status(String status) {
    return switch (status) {
      'PENDING' => l10n.statusPending,
      'CONFIRMED' => l10n.statusConfirmed,
      'CHECKED_IN' => l10n.statusCheckedIn,
      'COMPLETED' => l10n.statusCompleted,
      'CANCELLED' => l10n.statusCancelled,
      'NO_SHOW' => l10n.statusNoShow,
      _ => status,
    };
  }

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return Center(child: Text(l10n.emptyReservations));
    final format = DateFormat('EEE d MMM · HH:mm');
    return ListView.separated(
      padding: const EdgeInsets.only(top: 16, bottom: 120),
      itemCount: items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final item = items[index];
        final current = switch (item.status) {
          'PENDING' => 0,
          'CONFIRMED' => 1,
          'CHECKED_IN' => 2,
          'COMPLETED' => 3,
          _ => 0,
        };
        return GsbCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.bayName ?? item.bayId, style: Theme.of(context).textTheme.titleMedium),
              Text('${format.format(item.startAt)} – ${DateFormat.Hm().format(item.endAt)}'),
              Text(l10n.companionsCount(item.companionCount)),
              Text(l10n.totalCostLabel(formatBrl(item.totalCostBrl))),
              const SizedBox(height: 8),
              GsbStatusStepper(
                current: current,
                steps: [l10n.statusPending, l10n.statusConfirmed, l10n.statusCheckedIn, l10n.statusCompleted],
              ),
              const SizedBox(height: 8),
              Text(_status(item.status)),
              if (item.canCancel)
                TextButton(
                  onPressed: () => context.read<ReservationCubit>().cancel(item.id),
                  child: Text(l10n.cancelReservation),
                ),
            ],
          ),
        );
      },
    );
  }
}
