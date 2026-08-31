import 'package:flutter/material.dart';
import 'package:folf/features/reservation/domain/bay_live_status.dart';
import 'package:folf/l10n/app_localizations.dart';

typedef BayStatusStyle = ({String label, Color badgeColor, Color badgeForeground, Color accent});

BayStatusStyle bayStatusStyle({
  required BuildContext context,
  required AppLocalizations l10n,
  required BayLiveStatus status,
}) {
  final colors = Theme.of(context).colorScheme;
  return switch (status) {
    BayLiveStatus.available => (
        label: l10n.bayAvailable,
        badgeColor: colors.primary.withValues(alpha: 0.14),
        badgeForeground: colors.primary,
        accent: colors.primary,
      ),
    BayLiveStatus.occupied => (
        label: l10n.bayOccupied,
        badgeColor: colors.tertiary.withValues(alpha: 0.18),
        badgeForeground: colors.tertiary,
        accent: colors.tertiary,
      ),
  };
}
