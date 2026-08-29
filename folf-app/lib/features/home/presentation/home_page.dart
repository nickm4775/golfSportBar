import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/config/app_config.dart';
import 'package:folf/core/format/brl.dart';
import 'package:folf/core/theme/gsb_theme.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/core/widgets/menu_image.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/features/home/presentation/home_cubit.dart';
import 'package:folf/features/order/presentation/order_status_label.dart';
import 'package:folf/features/reservation/domain/reservation.dart';
import 'package:folf/features/venue/domain/venue.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _reload());
  }

  Future<void> _reload() async {
    final session = context.read<VenueSessionCubit>();
    final venues = await context.read<HomeCubit>().load(businessId: session.state.venue?.id);
    await session.hydrate(venues);
    if (session.state.venue != null && mounted) {
      await context.read<HomeCubit>().load(businessId: session.state.venue!.id);
    }
  }

  Future<void> _openDirections(Venue venue) async {
    final uri = venue.lat != null && venue.lng != null
        ? Uri.parse('https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}')
        : Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(venue.fullAddress)}');
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = context.watch<AuthBloc>().state;
    final name = auth is AuthAuthenticated ? auth.profile.firstName.trim() : '';
    final venue = context.watch<VenueSessionCubit>().state.venue;
    final config = GetIt.I<AppConfig>();
    final colors = Theme.of(context).colorScheme;
    final greeting = name.isEmpty ? l10n.greetingGuest : l10n.greeting(name);

    return GsbScaffold(
      body: BlocBuilder<HomeCubit, HomeState>(
        builder: (context, state) {
          if (state.loading && state.venues.isEmpty) return const GsbLoading();
          if (state.message != null && state.venues.isEmpty) {
            return GsbError(
              message: state.message!.isEmpty ? l10n.errorGeneric : state.message!,
              onRetry: _reload,
              retryLabel: l10n.retry,
            );
          }

          final featured = state.menu?.featured ?? const <MenuItem>[];

          return RefreshIndicator(
            onRefresh: _reload,
            child: ListView(
              padding: const EdgeInsets.only(bottom: 120),
              children: [
                Text(
                  greeting,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.62),
                        letterSpacing: 0.2,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.headline,
                  style: GsbTheme.display(colors.onSurface).copyWith(fontSize: 32, height: 1.12),
                ),
                const SizedBox(height: 10),
                Text(
                  l10n.subhead,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.72),
                        height: 1.4,
                      ),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    Expanded(
                      child: _QuickAction(
                        icon: Icons.event_available_outlined,
                        label: l10n.ctaReserve,
                        onTap: () => context.go('/app/reserve'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _QuickAction(
                        icon: Icons.room_service_outlined,
                        label: l10n.ctaOrder,
                        onTap: () => context.go('/app/order'),
                      ),
                    ),
                  ],
                ),
                if (state.nextReservation != null) ...[
                  const SizedBox(height: 20),
                  _StatusCard(
                    eyebrow: l10n.upcomingReservation,
                    title: _reservationTitle(l10n, state.nextReservation!),
                    subtitle: _reservationWhen(context, state.nextReservation!),
                    chip: _reservationStatus(l10n, state.nextReservation!.status),
                    icon: Icons.golf_course_outlined,
                    onTap: () => context.go('/app/reserve'),
                  ),
                ],
                if (state.activeOrder != null) ...[
                  const SizedBox(height: 10),
                  _StatusCard(
                    eyebrow: l10n.activeOrder,
                    title: state.activeOrder!.tableLabel == null || state.activeOrder!.tableLabel!.isEmpty
                        ? l10n.orderTitle
                        : l10n.orderAtTable(state.activeOrder!.tableLabel!),
                    subtitle: formatBrl(state.activeOrder!.totalBrl),
                    chip: orderStatusLabel(l10n, state.activeOrder!.status),
                    icon: Icons.receipt_long_outlined,
                    onTap: () => context.go('/app/order/history'),
                  ),
                ],
                if (venue != null) ...[
                  const SizedBox(height: 20),
                  GsbCard(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: colors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(Icons.location_on_outlined, color: colors.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                l10n.featuredVenue,
                                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                      color: colors.onSurface.withValues(alpha: 0.55),
                                    ),
                              ),
                              const SizedBox(height: 2),
                              Text(venue.name, style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 2),
                              Text(
                                venue.fullAddress,
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: colors.onSurface.withValues(alpha: 0.68),
                                    ),
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 4,
                                children: [
                                  TextButton(
                                    onPressed: () => context.go('/app/map'),
                                    style: TextButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                      padding: EdgeInsets.zero,
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: Text(l10n.mapTitle),
                                  ),
                                  TextButton(
                                    onPressed: () => _openDirections(venue),
                                    style: TextButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                      padding: EdgeInsets.zero,
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ),
                                    child: Text(l10n.howToGetThere),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                Text(l10n.experienceTitle, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                GsbCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    children: [
                      _ExperienceRow(icon: Icons.sports_golf_outlined, title: l10n.slideBayTitle, copy: l10n.slideBayCopy),
                      Divider(height: 1, color: colors.onSurface.withValues(alpha: 0.08)),
                      _ExperienceRow(icon: Icons.speed_outlined, title: l10n.slideTechTitle, copy: l10n.slideTechCopy),
                      Divider(height: 1, color: colors.onSurface.withValues(alpha: 0.08)),
                      _ExperienceRow(icon: Icons.local_bar_outlined, title: l10n.slideNightTitle, copy: l10n.slideNightCopy),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(l10n.menuFeatured, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 10),
                if (featured.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      l10n.emptyMenu,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: colors.onSurface.withValues(alpha: 0.62),
                          ),
                    ),
                  )
                else
                  for (final item in featured)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: GsbCard(
                        onTap: () => context.go('/app/order'),
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            MenuImage(src: item.imageSrc, size: 72),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                  if (item.description.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      item.description,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: colors.onSurface.withValues(alpha: 0.62),
                                          ),
                                    ),
                                  ],
                                  const SizedBox(height: 6),
                                  Text(
                                    formatBrl(item.priceBrl),
                                    style: TextStyle(color: colors.primary, fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                if (featured.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  OutlinedButton(onPressed: () => context.go('/app/order'), child: Text(l10n.seeFullMenu)),
                ],
                const SizedBox(height: 8),
                Center(
                  child: TextButton.icon(
                    onPressed: () => launchUrl(Uri.parse(config.instagramUrl), mode: LaunchMode.externalApplication),
                    icon: const Icon(Icons.camera_alt_outlined, size: 18),
                    label: Text(l10n.followInstagram),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _reservationTitle(AppLocalizations l10n, Reservation reservation) {
    final bay = reservation.bayName?.trim();
    if (bay == null || bay.isEmpty) return l10n.pickBay;
    return bay;
  }

  String _reservationWhen(BuildContext context, Reservation reservation) {
    final locale = Localizations.localeOf(context).toLanguageTag();
    final date = DateFormat.MMMd(locale).format(reservation.startAt);
    final start = DateFormat.Hm(locale).format(reservation.startAt);
    final end = DateFormat.Hm(locale).format(reservation.endAt);
    return '$date · $start–$end';
  }

  String _reservationStatus(AppLocalizations l10n, String status) {
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
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return GsbCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: colors.primary, size: 22),
          ),
          const SizedBox(height: 12),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w700, height: 1.25)),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.chip,
    required this.icon,
    required this.onTap,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final String chip;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return GsbCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: colors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eyebrow,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.55),
                      ),
                ),
                const SizedBox(height: 2),
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.68),
                      ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: colors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    chip,
                    style: TextStyle(color: colors.primary, fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, color: colors.onSurface.withValues(alpha: 0.35)),
        ],
      ),
    );
  }
}

class _ExperienceRow extends StatelessWidget {
  const _ExperienceRow({required this.icon, required this.title, required this.copy});

  final IconData icon;
  final String title;
  final String copy;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: colors.primary, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(
                  copy,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.68),
                        height: 1.35,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
