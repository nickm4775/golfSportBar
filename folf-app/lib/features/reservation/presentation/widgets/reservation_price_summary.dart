import 'package:flutter/material.dart';
import 'package:folf/core/format/brl.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/reservation/domain/gspro_pricing.dart';
import 'package:folf/l10n/app_localizations.dart';

class ReservationPriceSummary extends StatelessWidget {
  const ReservationPriceSummary({
    super.key,
    required this.companionCount,
    required this.durationHours,
  });

  final int companionCount;
  final int durationHours;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;
    final partySize = 1 + companionCount;
    final unitPriceBrl = pricePerPersonBrl(partySize);
    final total = computeReservationTotal(
      companionCount: companionCount,
      duration: Duration(hours: durationHours),
    );

    return GsbCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.estimatedTotal,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.72),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  l10n.reservationSummary(partySize, l10n.hours(durationHours)),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.72),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  l10n.pricingPreview(
                    partySize,
                    formatBrl(unitPriceBrl),
                    '$durationHours',
                    formatBrl(total),
                  ),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.6),
                      ),
                ),
              ],
            ),
          ),
          Text(
            formatBrl(total),
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: colors.primary,
                ),
          ),
        ],
      ),
    );
  }
}
