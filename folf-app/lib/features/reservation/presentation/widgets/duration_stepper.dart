import 'package:flutter/material.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/reservation/domain/availability_slots.dart';
import 'package:folf/l10n/app_localizations.dart';

class DurationStepper extends StatelessWidget {
  const DurationStepper({
    super.key,
    required this.hours,
    required this.onChanged,
  });

  final int hours;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;

    return GsbCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          IconButton.filledTonal(
            onPressed: hours > 1 ? () => onChanged(hours - 1) : null,
            icon: const Icon(Icons.remove_rounded),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  l10n.hours(hours),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                  textAlign: TextAlign.center,
                ),
                Text(
                  l10n.durationHoursHint(kMaxReservationHours),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.onSurface.withValues(alpha: 0.62),
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          IconButton.filledTonal(
            onPressed: hours < kMaxReservationHours ? () => onChanged(hours + 1) : null,
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
    );
  }
}
