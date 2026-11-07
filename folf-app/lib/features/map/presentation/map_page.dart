import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/home/presentation/home_cubit.dart';
import 'package:folf/features/map/presentation/map_tiles.dart';
import 'package:folf/features/venue/domain/venue.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final cubit = context.read<HomeCubit>();
      if (cubit.state.venues.isEmpty) cubit.load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final venues = context.watch<HomeCubit>().state.venues;
    final withCoords = venues.where((row) => row.lat != null && row.lng != null).toList();
    final center = withCoords.isNotEmpty
        ? LatLng(withCoords.first.lat!, withCoords.first.lng!)
        : const LatLng(-27.001654891900937, -48.622958970800916);

    final dark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox.expand(
      child: Stack(
        children: [
          FlutterMap(
            options: MapOptions(initialCenter: center, initialZoom: 15.5),
            children: [
              ThemedMapLayer(dark: dark),
              MarkerLayer(
                markers: [
                  for (final venue in withCoords)
                    Marker(
                      point: LatLng(venue.lat!, venue.lng!),
                      width: 48,
                      height: 48,
                      child: GestureDetector(
                        onTap: () => _openSheet(context, venue),
                        child: Container(
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.4),
                                blurRadius: 12,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.golf_course, color: Colors.white),
                        ),
                      ),
                    ),
                ],
              ),
              const SimpleAttributionWidget(
                source: Text('OpenFreeMap, OpenMapTiles, OpenStreetMap'),
              ),
            ],
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Align(
                alignment: Alignment.topLeft,
                child: GsbCard(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Text(l10n.mapTitle, style: Theme.of(context).textTheme.titleLarge),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _openSheet(BuildContext context, Venue venue) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(venue.name, style: Theme.of(context).textTheme.headlineSmall),
              Text(venue.fullAddress),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () {
                  context.read<VenueSessionCubit>().selectVenue(venue);
                  Navigator.pop(context);
                  context.go('/app/reserve');
                },
                child: Text(l10n.reserveHere),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () {
                  context.read<VenueSessionCubit>().selectVenue(venue);
                  Navigator.pop(context);
                  context.go('/app/order');
                },
                child: Text(l10n.orderHere),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () {
                  final uri = Uri.parse(
                    'https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}',
                  );
                  launchUrl(uri, mode: LaunchMode.externalApplication);
                },
                child: Text(l10n.howToGetThere),
              ),
            ],
          ),
        );
      },
    );
  }
}
