import 'package:folf/features/venue/domain/venue.dart';

const Duration kDefaultSlotDuration = Duration(hours: 1);
const Duration kSlotStep = Duration(minutes: 30);
const int kMaxReservationHours = 6;

DateTime dayOpens(DateTime day) => DateTime(day.year, day.month, day.day, 10);

DateTime dayCloses(DateTime day) => DateTime(day.year, day.month, day.day, 23);

bool slotOverlapsBusy(DateTime start, Duration duration, List<BusySlot> busy) {
  final end = start.add(duration);
  return busy.any((slot) => start.isBefore(slot.endAt) && end.isAfter(slot.startAt));
}

List<DateTime> freeStarts({
  required DateTime day,
  required Duration duration,
  required List<BusySlot> busy,
  DateTime? now,
}) {
  final reference = now ?? DateTime.now();
  final opens = dayOpens(day);
  final closes = dayCloses(day);
  final slots = <DateTime>[];
  var cursor = opens;
  while (cursor.add(duration).isBefore(closes) || cursor.add(duration).isAtSameMomentAs(closes)) {
    final end = cursor.add(duration);
    if (!slotOverlapsBusy(cursor, duration, busy) && end.isAfter(reference)) {
      slots.add(cursor);
    }
    cursor = cursor.add(kSlotStep);
  }
  return slots;
}

bool isFreeNow({
  required DateTime day,
  required Duration duration,
  required List<BusySlot> busy,
  DateTime? now,
}) {
  final reference = now ?? DateTime.now();
  if (reference.day != day.day || reference.month != day.month || reference.year != day.year) {
    return false;
  }
  final closes = dayCloses(day);
  if (reference.add(duration).isAfter(closes)) return false;
  return !slotOverlapsBusy(reference, duration, busy);
}

DateTime? nextFreeStart({
  required DateTime day,
  required Duration duration,
  required List<BusySlot> busy,
  DateTime? now,
}) {
  final slots = freeStarts(day: day, duration: duration, busy: busy, now: now);
  return slots.isEmpty ? null : slots.first;
}
