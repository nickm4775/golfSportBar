import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/theme/gsb_theme.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _identifier = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return GsbScaffold(
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) context.go('/app/home');
        },
        builder: (context, state) {
          final loading = state is AuthLoading;
          final message = state is AuthUnauthenticated ? state.message : null;
          return ListView(
            children: [
              const SizedBox(height: 24),
              const GsbLogo(),
              const SizedBox(height: 28),
              Text(l10n.loginTitle, style: GsbTheme.display(Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 8),
              Text(l10n.loginSubtitle, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: 28),
              TextField(
                controller: _identifier,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: l10n.identifier),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: true,
                decoration: InputDecoration(labelText: l10n.password),
              ),
              if (message != null) ...[
                const SizedBox(height: 12),
                Text(message, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: loading
                    ? null
                    : () => context.read<AuthBloc>().add(
                          AuthLoginSubmitted(_identifier.text.trim(), _password.text),
                        ),
                child: loading ? const CircularProgressIndicator.adaptive() : Text(l10n.loginCta),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => context.push('/register'),
                child: Text('${l10n.noAccount} ${l10n.registerCta}'),
              ),
            ],
          );
        },
      ),
    );
  }
}
