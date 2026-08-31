import 'package:flutter/material.dart';

class BayOptionCard extends StatelessWidget {
  const BayOptionCard({
    super.key,
    required this.name,
    this.subtitle,
    this.badgeLabel,
    this.badgeColor,
    this.badgeForeground,
    this.selected = false,
    this.accentColor,
    this.onTap,
    this.action,
  });

  final String name;
  final String? subtitle;
  final String? badgeLabel;
  final Color? badgeColor;
  final Color? badgeForeground;
  final bool selected;
  final Color? accentColor;
  final VoidCallback? onTap;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final accent = accentColor ?? colors.primary;
    final iconBg = accent.withValues(alpha: 0.18);

    final card = DecoratedBox(
      decoration: BoxDecoration(
        color: selected ? colors.primary.withValues(alpha: 0.08) : colors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: selected ? colors.primary : colors.onSurface.withValues(alpha: 0.1),
          width: selected ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: colors.primary.withValues(alpha: selected ? 0.12 : 0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                  child: Icon(
                    Icons.sports_golf_rounded,
                    color: selected ? colors.primary : colors.onSurface.withValues(alpha: 0.72),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: colors.onSurface.withValues(alpha: 0.72),
                              ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (badgeLabel != null || selected)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (badgeLabel != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: badgeColor ?? colors.primary.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            badgeLabel!,
                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: badgeForeground ?? colors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                      if (selected) ...[
                        if (badgeLabel != null) const SizedBox(height: 6),
                        Icon(Icons.check_circle_rounded, color: colors.primary, size: 22),
                      ],
                    ],
                  ),
              ],
            ),
            if (action != null) ...[
              const SizedBox(height: 14),
              SizedBox(width: double.infinity, child: action!),
            ],
          ],
        ),
      ),
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
