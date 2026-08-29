import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/theme/theme_cubit.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/features/notifications/notifications_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class GsbTopBar extends StatelessWidget {
  const GsbTopBar({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context);
    return Material(
      color: colors.surface,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 6, 8, 6),
            child: Row(
              children: [
                Expanded(
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Image.asset(
                      dark ? 'assets/brand/logo-on-dark.png' : 'assets/brand/logo-on-light.png',
                      height: 48,
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.medium,
                      semanticLabel: l10n.appName,
                    ),
                  ),
                ),
                const _NotificationsMenu(),
                const SizedBox(width: 4),
                const _AccountMenu(),
              ],
            ),
          ),
          Divider(height: 1, color: colors.onSurface.withValues(alpha: 0.08)),
        ],
      ),
    );
  }
}

class _NotificationsMenu extends StatelessWidget {
  const _NotificationsMenu();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return PopupMenuButton<String>(
      tooltip: l10n.notifications,
      position: PopupMenuPosition.under,
      offset: const Offset(0, 8),
      constraints: const BoxConstraints(minWidth: 280, maxWidth: 340, maxHeight: 360),
      onOpened: () => context.read<NotificationsCubit>().markAllRead(),
      onSelected: (_) {
        if (context.mounted) context.go('/app/order/history');
      },
      itemBuilder: (context) {
        final items = context.read<NotificationsCubit>().state.items;
        if (items.isEmpty) {
          return [
            PopupMenuItem<String>(
              enabled: false,
              child: SizedBox(
                width: 260,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(l10n.noNotifications),
                ),
              ),
            ),
          ];
        }
        return [
          for (final item in items)
            PopupMenuItem<String>(
              value: item.id,
              child: SizedBox(
                width: 260,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _label(l10n, item.kind),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      DateFormat.Hm().format(item.createdAt),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
        ];
      },
      child: BlocBuilder<NotificationsCubit, NotificationsState>(
        buildWhen: (previous, current) => previous.unread != current.unread,
        builder: (context, state) {
          return Padding(
            padding: const EdgeInsets.all(8),
            child: Badge(
              isLabelVisible: state.unread > 0,
              backgroundColor: Theme.of(context).colorScheme.primary,
              label: Text('${state.unread}'),
              child: Icon(
                state.unread > 0 ? Icons.notifications_rounded : Icons.notifications_outlined,
              ),
            ),
          );
        },
      ),
    );
  }

  String _label(AppLocalizations l10n, AppNotificationKind kind) {
    return switch (kind) {
      AppNotificationKind.orderReady => l10n.orderReady,
    };
  }
}

class _AccountMenu extends StatelessWidget {
  const _AccountMenu();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = context.watch<AuthBloc>().state;
    final profile = auth is AuthAuthenticated ? auth.profile : null;
    final colors = Theme.of(context).colorScheme;

    return PopupMenuButton<String>(
      tooltip: l10n.accountMenu,
      position: PopupMenuPosition.under,
      offset: const Offset(0, 8),
      onSelected: (value) {
        if (value == 'theme') {
          context.read<ThemeCubit>().toggle(
                platform: MediaQuery.platformBrightnessOf(context),
              );
          return;
        }
        if (value == 'logout') {
          context.read<AuthBloc>().add(const AuthLogoutRequested());
          return;
        }
        if (value.startsWith('locale:')) {
          context.read<LocaleCubit>().setLocale(Locale(value.substring(7)));
        }
      },
      itemBuilder: (context) => [
        if (profile != null)
          PopupMenuItem(
            enabled: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                Text(profile.email, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'theme',
          child: Row(
            children: [
              Icon(
                Theme.of(context).brightness == Brightness.dark
                    ? Icons.light_mode_outlined
                    : Icons.dark_mode_outlined,
              ),
              const SizedBox(width: 12),
              Text(l10n.themeToggle),
            ],
          ),
        ),
        PopupMenuItem(
          enabled: false,
          child: Text(l10n.language, style: Theme.of(context).textTheme.labelLarge),
        ),
        for (final locale in LocaleCubit.supported)
          PopupMenuItem(
            value: 'locale:${locale.languageCode}',
            child: Text(locale.languageCode.toUpperCase()),
          ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'logout',
          child: Row(
            children: [
              const Icon(Icons.logout_rounded),
              const SizedBox(width: 12),
              Text(l10n.logout),
            ],
          ),
        ),
      ],
      child: Padding(
        padding: const EdgeInsets.fromLTRB(4, 6, 8, 6),
        child: CircleAvatar(
          radius: 18,
          backgroundColor: colors.primary,
          foregroundColor: colors.onPrimary,
          child: Text(
            profile?.initials ?? '?',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          ),
        ),
      ),
    );
  }
}
