import 'package:flutter/material.dart';
import 'package:folf/core/theme/gsb_theme.dart';

class GsbScaffold extends StatelessWidget {
  const GsbScaffold({
    super.key,
    required this.body,
    this.padding,
    this.bottom,
    this.floating,
  });

  final Widget body;
  final EdgeInsetsGeometry? padding;
  final Widget? bottom;
  final Widget? floating;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final painted = DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        gradient: RadialGradient(
          center: const Alignment(0, -1.1),
          radius: 1.1,
          colors: [
            colors.primary.withValues(alpha: 0.14),
            Theme.of(context).scaffoldBackgroundColor,
          ],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: padding ?? const EdgeInsets.fromLTRB(20, 8, 20, 0),
          child: body,
        ),
      ),
    );

    if (Scaffold.maybeOf(context) != null) {
      return SizedBox.expand(
        child: Stack(
          fit: StackFit.expand,
          children: [
            painted,
            if (floating != null)
              Positioned(right: 16, bottom: 16, child: floating!),
            if (bottom != null)
              Positioned(left: 0, right: 0, bottom: 0, child: bottom!),
          ],
        ),
      );
    }

    return Scaffold(
      extendBody: true,
      floatingActionButton: floating,
      body: painted,
      bottomNavigationBar: bottom,
    );
  }
}

class GsbCard extends StatelessWidget {
  const GsbCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(18),
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final fg = Theme.of(context).colorScheme.onSurface;
    final card = DecoratedBox(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: fg.withValues(alpha: 0.1)),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(padding: padding, child: child),
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: card,
      ),
    );
  }
}

class GsbLogo extends StatelessWidget {
  const GsbLogo({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final fg = Theme.of(context).colorScheme.onSurface;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Golf', style: GsbTheme.script(fg).copyWith(fontSize: compact ? 36 : 52)),
        Text(
          'SPORT BAR',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
                letterSpacing: 4.2,
                fontWeight: FontWeight.w700,
                color: fg.withValues(alpha: 0.72),
              ),
        ),
      ],
    );
  }
}

class GsbChip extends StatelessWidget {
  const GsbChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? colors.primary : colors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? colors.onPrimary : colors.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class GsbStatusStepper extends StatelessWidget {
  const GsbStatusStepper({super.key, required this.steps, required this.current});

  final List<String> steps;
  final int current;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i <= current ? colors.primary : colors.onSurface.withValues(alpha: 0.2),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  steps[i],
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: i <= current ? colors.onSurface : colors.onSurface.withValues(alpha: 0.5),
                      ),
                ),
              ],
            ),
          ),
          if (i < steps.length - 1)
            Expanded(
              child: Container(
                height: 1,
                margin: const EdgeInsets.only(bottom: 18),
                color: i < current
                    ? colors.primary
                    : colors.onSurface.withValues(alpha: 0.12),
              ),
            ),
        ],
      ],
    );
  }
}

class GsbLoading extends StatelessWidget {
  const GsbLoading({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(color: Theme.of(context).colorScheme.primary),
    );
  }
}

class GsbError extends StatelessWidget {
  const GsbError({
    super.key,
    required this.message,
    required this.onRetry,
    this.retryLabel = 'OK',
  });

  final String message;
  final VoidCallback onRetry;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: Text(retryLabel)),
          ],
        ),
      ),
    );
  }
}

class GsbTabBar extends StatelessWidget {
  const GsbTabBar({
    super.key,
    required this.index,
    required this.tooltips,
    required this.onTap,
  });

  final int index;
  final List<String> tooltips;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final icons = const [
      Icons.home_outlined,
      Icons.map_outlined,
      Icons.qr_code_scanner_rounded,
      Icons.event_available_outlined,
      Icons.room_service_outlined,
    ];
    final active = const [
      Icons.home_rounded,
      Icons.map_rounded,
      Icons.qr_code_scanner_rounded,
      Icons.event_available_rounded,
      Icons.room_service_rounded,
    ];

    final bottomPad = MediaQuery.viewPaddingOf(context).bottom.clamp(8.0, 36.0);
    return Material(
      color: colors.surface,
      elevation: 10,
      shadowColor: colors.primary.withValues(alpha: 0.22),
      child: Padding(
        padding: EdgeInsets.fromLTRB(4, 6, 4, bottomPad),
        child: Row(
          children: [
            for (var i = 0; i < 5; i++)
              Expanded(
                child: _TabIcon(
                  tooltip: tooltips[i],
                  selected: index == i,
                  elevated: i == 2,
                  icon: index == i ? active[i] : icons[i],
                  onTap: () => onTap(i),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TabIcon extends StatelessWidget {
  const _TabIcon({
    required this.tooltip,
    required this.selected,
    required this.elevated,
    required this.icon,
    required this.onTap,
  });

  final String tooltip;
  final bool selected;
  final bool elevated;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final child = Semantics(
      button: true,
      label: tooltip,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          width: elevated ? 58 : 46,
          height: elevated ? 58 : 46,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: selected
                ? colors.primary
                : elevated
                    ? colors.primary.withValues(alpha: 0.16)
                    : Colors.transparent,
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: colors.primary.withValues(alpha: 0.35),
                      blurRadius: 16,
                    ),
                  ]
                : null,
          ),
          child: Icon(
            icon,
            color: selected ? colors.onPrimary : colors.onSurface.withValues(alpha: 0.72),
          ),
        ),
      ),
    );
    return Tooltip(message: tooltip, child: Center(child: child));
  }
}
