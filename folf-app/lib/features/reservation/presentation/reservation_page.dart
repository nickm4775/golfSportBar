import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/reservation/domain/reservation.dart';
import 'package:folf/features/reservation/presentation/reservation_cubit.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class ReservationPage extends StatefulWidget {
  const ReservationPage({super.key});

  @override
  State<ReservationPage> createState() => _ReservationPageState();
}

class _ReservationPageState extends State<ReservationPage> with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final venue = context.read<VenueSessionCubit>().state.venue;
      if (venue != null) context.read<ReservationCubit>().bootstrap(venue.id);
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
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
    final time = DateFormat.Hm();
    return ListView(
      padding: const EdgeInsets.only(top: 16, bottom: 120),
      children: [
        Text(l10n.pickBay),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            for (final bay in state.bays)
              GsbChip(
                label: bay.name,
                selected: bay.id == state.selectedBayId,
                onTap: () => cubit.selectBay(venueId, bay.id),
              ),
          ],
        ),
        const SizedBox(height: 16),
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
        Text(l10n.duration),
        Wrap(
          spacing: 8,
          children: [
            for (final minutes in [60, 90, 120])
              GsbChip(
                label: l10n.minutes(minutes),
                selected: state.duration.inMinutes == minutes,
                onTap: () => cubit.selectDuration(Duration(minutes: minutes)),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (slots.isEmpty) Text(l10n.noSlots),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final slot in slots)
              GsbChip(
                label: time.format(slot),
                selected: state.selectedStart == slot,
                onTap: () => cubit.selectStart(slot),
              ),
          ],
        ),
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
