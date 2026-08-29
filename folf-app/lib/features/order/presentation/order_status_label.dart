import 'package:folf/l10n/app_localizations.dart';

String orderStatusLabel(AppLocalizations l10n, String status) {
  switch (status) {
    case 'DRAFT':
      return l10n.orderDraft;
    case 'OPEN':
      return l10n.orderOpen;
    case 'IN_PROGRESS':
      return l10n.orderInProgress;
    case 'COMPLETED':
      return l10n.orderCompleted;
    case 'CANCELLED':
      return l10n.orderCancelled;
    default:
      return status;
  }
}

String itemStatusLabel(AppLocalizations l10n, String status) {
  switch (status) {
    case 'PENDING':
      return l10n.itemPending;
    case 'PREPARING':
      return l10n.itemPreparing;
    case 'SERVED':
      return l10n.itemServed;
    case 'CANCELLED':
      return l10n.orderCancelled;
    default:
      return status;
  }
}
