import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/home/presentation/home_cubit.dart';
import 'package:folf/features/qr/presentation/qr_cubit.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';

class QrPage extends StatefulWidget {
  const QrPage({super.key});

  @override
  State<QrPage> createState() => _QrPageState();
}

class _QrPageState extends State<QrPage> {
  final _controller = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return BlocListener<QrCubit, QrState>(
      listener: (context, state) {
        if (state.result != null) _handle(context, state);
        if (state.message != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message!)));
          context.read<QrCubit>().clear();
        }
      },
      child: SizedBox.expand(
        child: Stack(
          children: [
            MobileScanner(
              controller: _controller,
              onDetect: (capture) {
                final value = capture.barcodes.firstOrNull?.rawValue;
                if (value != null) context.read<QrCubit>().scan(value);
              },
            ),
            Center(
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: Theme.of(context).colorScheme.primary, width: 3),
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    GsbCard(
                      child: Text(l10n.qrInstruction, textAlign: TextAlign.center),
                    ),
                    const Spacer(),
                    IconButton.filled(
                      tooltip: l10n.qrTorch,
                      onPressed: () => _controller.toggleTorch(),
                      icon: const Icon(Icons.flashlight_on_outlined),
                    ),
                    const SizedBox(height: 96),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handle(BuildContext context, QrState state) async {
    final l10n = AppLocalizations.of(context);
    final result = state.result!;
    if (result.kind == 'url' && result.url != null) {
      await launchUrl(Uri.parse(result.url!), mode: LaunchMode.externalApplication);
      if (context.mounted) context.read<QrCubit>().clear();
      return;
    }

    if (!context.mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(l10n.qrScanned, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(result.raw),
              const SizedBox(height: 16),
              if (result.kind == 'table')
                FilledButton(
                  onPressed: () {
                    final venues = context.read<HomeCubit>().state.venues;
                    VenueSessionCubit session = context.read<VenueSessionCubit>();
                    if (result.businessId != null) {
                      for (final venue in venues) {
                        if (venue.id == result.businessId) {
                          session.selectVenue(venue, tableLabel: result.tableLabel);
                        }
                      }
                    }
                    if (result.tableLabel != null) {
                      session.setTable(result.tableLabel!);
                    }
                    Navigator.pop(context);
                    context.go('/app/order');
                  },
                  child: Text(l10n.qrGoTable),
                ),
              if (result.kind == 'reservation')
                FilledButton(
                  onPressed: () {
                    Navigator.pop(context);
                    context.go('/app/reserve');
                  },
                  child: Text(l10n.qrGoReservation),
                ),
              if (result.kind == 'unknown') Text(l10n.qrUnknown),
            ],
          ),
        );
      },
    );
    if (context.mounted) context.read<QrCubit>().clear();
  }
}
