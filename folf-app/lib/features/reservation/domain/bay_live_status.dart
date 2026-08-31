import 'package:folf/features/reservation/domain/availability_slots.dart';
import 'package:folf/features/venue/domain/venue.dart';

const Duration kBayStatusRefreshInterval = Duration(seconds: 30);

enum BayLiveStatus { available, occupied }

bool isSameCalendarDay(DateTime a, DateTime b) {
  return a.year == b.year && a.month == b.month && a.day == b.day;
}

bool isBayOccupiedNow({
  required List<BusySlot> busy,
  DateTime? now,
}) {
  final reference = now ?? DateTime.now();
  return busy.any(
    (slot) =>
        !reference.isBefore(slot.startAt) && reference.isBefore(slot.endAt),
  );
}

BayLiveStatus resolveBayLiveStatus({
  required List<BusySlot> busy,
  DateTime? now,
}) {
  if (isBayOccupiedNow(busy: busy, now: now)) {
    return BayLiveStatus.occupied;
  }
  return BayLiveStatus.available;
}

bool bayCanReserveToday({
  required List<BusySlot> busy,
  DateTime? now,
}) {
  final reference = now ?? DateTime.now();
  final day = DateTime(reference.year, reference.month, reference.day);
  if (isFreeNow(day: day, duration: kDefaultSlotDuration, busy: busy, now: reference)) {
    return true;
  }
  return nextFreeStart(
        day: day,
        duration: kDefaultSlotDuration,
        busy: busy,
        now: reference,
      ) !=
      null;
}
