import 'package:flutter/material.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:intl/intl.dart';

enum _TimePeriod { morning, afternoon, evening }

class TimeSlotPicker extends StatefulWidget {
  const TimeSlotPicker({
    super.key,
    required this.slots,
    required this.duration,
    required this.selectedStart,
    required this.onSelected,
  });

  final List<DateTime> slots;
  final Duration duration;
  final DateTime? selectedStart;
  final ValueChanged<DateTime> onSelected;

  @override
  State<TimeSlotPicker> createState() => _TimeSlotPickerState();
}

class _TimeSlotPickerState extends State<TimeSlotPicker> {
  _TimePeriod? _activePeriod;

  static _TimePeriod _periodFor(DateTime slot) {
    if (slot.hour < 12) return _TimePeriod.morning;
    if (slot.hour < 18) return _TimePeriod.afternoon;
    return _TimePeriod.evening;
  }

  Map<_TimePeriod, List<DateTime>> _groupSlots() {
    final grouped = <_TimePeriod, List<DateTime>>{};
    for (final slot in widget.slots) {
      grouped.putIfAbsent(_periodFor(slot), () => []).add(slot);
    }
    return grouped;
  }

  List<_TimePeriod> _availablePeriods(Map<_TimePeriod, List<DateTime>> grouped) {
    return [
      _TimePeriod.morning,
      _TimePeriod.afternoon,
      _TimePeriod.evening,
    ].where(grouped.containsKey).toList();
  }

  _TimePeriod? _resolveActivePeriod(Map<_TimePeriod, List<DateTime>> grouped) {
    final available = _availablePeriods(grouped);
    if (available.isEmpty) return null;

    final selected = widget.selectedStart;
    if (selected != null) {
      final period = _periodFor(selected);
      if (grouped.containsKey(period)) return period;
    }

    if (_activePeriod != null && grouped.containsKey(_activePeriod)) {
      return _activePeriod;
    }

    return available.first;
  }

  @override
  void didUpdateWidget(TimeSlotPicker oldWidget) {
    super.didUpdateWidget(oldWidget);
    final grouped = _groupSlots();
    final next = _resolveActivePeriod(grouped);
    if (next != _activePeriod) {
      _activePeriod = next;
    }
  }

  String _periodLabel(AppLocalizations l10n, _TimePeriod period) {
    return switch (period) {
      _TimePeriod.morning => l10n.timePeriodMorning,
      _TimePeriod.afternoon => l10n.timePeriodAfternoon,
      _TimePeriod.evening => l10n.timePeriodEvening,
    };
  }

  IconData _periodIcon(_TimePeriod period) {
    return switch (period) {
      _TimePeriod.morning => Icons.wb_sunny_outlined,
      _TimePeriod.afternoon => Icons.wb_twilight_outlined,
      _TimePeriod.evening => Icons.nights_stay_outlined,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;
    final time = DateFormat.Hm();
    final grouped = _groupSlots();
    _activePeriod ??= _resolveActivePeriod(grouped);

    if (widget.slots.isEmpty) {
      return GsbCard(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: colors.onSurface.withValues(alpha: 0.06),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.event_busy_outlined, size: 28, color: colors.onSurface.withValues(alpha: 0.4)),
              ),
              const SizedBox(height: 14),
              Text(
                l10n.noSlots,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.onSurface.withValues(alpha: 0.72),
                    ),
              ),
            ],
          ),
        ),
      );
    }

    final availablePeriods = _availablePeriods(grouped);
    final activePeriod = _activePeriod ?? availablePeriods.first;
    final periodSlots = grouped[activePeriod] ?? [];
    final selected = widget.selectedStart;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (selected != null)
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: colors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: colors.primary.withValues(alpha: 0.35)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: colors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.check_rounded, color: colors.onPrimary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.selectedTimeSlotLabel,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: colors.onSurface.withValues(alpha: 0.7),
                            ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.timeSlotRange(
                          time.format(selected),
                          time.format(selected.add(widget.duration)),
                        ),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        GsbCard(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _PeriodSelector(
                periods: availablePeriods,
                active: activePeriod,
                labelFor: (period) => _periodLabel(l10n, period),
                iconFor: _periodIcon,
                countFor: (period) => grouped[period]?.length ?? 0,
                onSelected: (period) => setState(() => _activePeriod = period),
              ),
              const SizedBox(height: 14),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                switchInCurve: Curves.easeOut,
                switchOutCurve: Curves.easeIn,
                child: periodSlots.isEmpty
                    ? Padding(
                        key: ValueKey('empty-$activePeriod'),
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        child: Text(
                          l10n.noSlotsInPeriod,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: colors.onSurface.withValues(alpha: 0.62),
                              ),
                        ),
                      )
                    : GridView.builder(
                        key: ValueKey(activePeriod),
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1.55,
                        ),
                        itemCount: periodSlots.length,
                        itemBuilder: (context, index) {
                          final slot = periodSlots[index];
                          final end = slot.add(widget.duration);
                          final isSelected = selected == slot;
                          return _TimeSlotTile(
                            startLabel: time.format(slot),
                            endLabel: time.format(end),
                            selected: isSelected,
                            onTap: () => widget.onSelected(slot),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _PeriodSelector extends StatelessWidget {
  const _PeriodSelector({
    required this.periods,
    required this.active,
    required this.labelFor,
    required this.iconFor,
    required this.countFor,
    required this.onSelected,
  });

  final List<_TimePeriod> periods;
  final _TimePeriod active;
  final String Function(_TimePeriod) labelFor;
  final IconData Function(_TimePeriod) iconFor;
  final int Function(_TimePeriod) countFor;
  final ValueChanged<_TimePeriod> onSelected;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.onSurface.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Row(
          children: [
            for (final period in periods) ...[
              Expanded(
                child: _PeriodTab(
                  label: labelFor(period),
                  icon: iconFor(period),
                  count: countFor(period),
                  selected: period == active,
                  onTap: () => onSelected(period),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PeriodTab extends StatelessWidget {
  const _PeriodTab({
    required this.label,
    required this.icon,
    required this.count,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final int count;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final fg = selected ? colors.onPrimary : colors.onSurface.withValues(alpha: 0.75);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            color: selected ? colors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: colors.primary.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: fg),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: fg,
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                '$count',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: fg.withValues(alpha: 0.85),
                      fontSize: 10,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimeSlotTile extends StatelessWidget {
  const _TimeSlotTile({
    required this.startLabel,
    required this.endLabel,
    required this.selected,
    required this.onTap,
  });

  final String startLabel;
  final String endLabel;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: selected ? colors.primary : colors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? colors.primary : colors.onSurface.withValues(alpha: 0.12),
              width: selected ? 1.5 : 1,
            ),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: colors.primary.withValues(alpha: 0.22),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                startLabel,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: selected ? colors.onPrimary : colors.onSurface,
                    ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Icon(
                  Icons.arrow_downward_rounded,
                  size: 12,
                  color: selected
                      ? colors.onPrimary.withValues(alpha: 0.75)
                      : colors.onSurface.withValues(alpha: 0.35),
                ),
              ),
              Text(
                endLabel,
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: selected
                          ? colors.onPrimary.withValues(alpha: 0.9)
                          : colors.onSurface.withValues(alpha: 0.55),
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
