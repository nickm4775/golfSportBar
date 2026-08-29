import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/theme/gsb_theme.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/auth/domain/auth.dart';
import 'package:folf/features/auth/presentation/auth_bloc.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  int _step = 0;
  bool _lgpd = false;
  final _name = TextEditingController();
  final _cpf = TextEditingController();
  final _birth = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _cep = TextEditingController();
  final _street = TextEditingController();
  final _number = TextEditingController();
  final _city = TextEditingController();
  final _state = TextEditingController();

  @override
  void dispose() {
    for (final controller in [_name, _cpf, _birth, _email, _phone, _password, _cep, _street, _number, _city, _state]) {
      controller.dispose();
    }
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
              TextButton.icon(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back),
                label: Text(l10n.back),
              ),
              Text(l10n.registerTitle, style: GsbTheme.display(Theme.of(context).colorScheme.onSurface)),
              const SizedBox(height: 16),
              Row(
                children: [
                  for (var i = 0; i < 3; i++)
                    Expanded(
                      child: Container(
                        height: 4,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          color: i <= _step
                              ? Theme.of(context).colorScheme.primary
                              : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),
              if (_step == 0) ...[
                TextField(controller: _name, decoration: InputDecoration(labelText: l10n.fullName)),
                const SizedBox(height: 12),
                TextField(controller: _cpf, decoration: InputDecoration(labelText: l10n.cpf), keyboardType: TextInputType.number),
                const SizedBox(height: 12),
                TextField(controller: _birth, decoration: InputDecoration(labelText: '${l10n.birthDate} (YYYY-MM-DD)')),
              ] else if (_step == 1) ...[
                TextField(controller: _email, decoration: InputDecoration(labelText: l10n.email), keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 12),
                TextField(controller: _phone, decoration: InputDecoration(labelText: l10n.phone), keyboardType: TextInputType.phone),
                const SizedBox(height: 12),
                TextField(controller: _password, obscureText: true, decoration: InputDecoration(labelText: l10n.password)),
              ] else ...[
                Text(l10n.addressOptional, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                TextField(controller: _cep, decoration: InputDecoration(labelText: l10n.postalCode)),
                const SizedBox(height: 12),
                TextField(controller: _street, decoration: InputDecoration(labelText: l10n.street)),
                const SizedBox(height: 12),
                TextField(controller: _number, decoration: InputDecoration(labelText: l10n.streetNumber)),
                const SizedBox(height: 12),
                TextField(controller: _city, decoration: InputDecoration(labelText: l10n.city)),
                const SizedBox(height: 12),
                TextField(controller: _state, decoration: InputDecoration(labelText: l10n.state)),
                const SizedBox(height: 12),
                CheckboxListTile(
                  value: _lgpd,
                  onChanged: (value) => setState(() => _lgpd = value ?? false),
                  title: Text(l10n.lgpdLabel),
                  contentPadding: EdgeInsets.zero,
                ),
              ],
              if (message != null) ...[
                const SizedBox(height: 12),
                Text(message, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              ],
              const SizedBox(height: 24),
              FilledButton(
                onPressed: loading
                    ? null
                    : () {
                        if (_step < 2) {
                          setState(() => _step += 1);
                          return;
                        }
                        context.read<AuthBloc>().add(
                              AuthRegisterSubmitted(
                                RegisterPayload(
                                  fullName: _name.text.trim(),
                                  cpf: _cpf.text.trim(),
                                  email: _email.text.trim(),
                                  phone: _phone.text.trim(),
                                  birthDate: _birth.text.trim(),
                                  password: _password.text,
                                  lgpdAccepted: _lgpd,
                                  postalCode: _cep.text.trim(),
                                  street: _street.text.trim(),
                                  streetNumber: _number.text.trim(),
                                  city: _city.text.trim(),
                                  state: _state.text.trim(),
                                ),
                              ),
                            );
                      },
                child: Text(_step < 2 ? l10n.next : l10n.registerCta),
              ),
            ],
          );
        },
      ),
    );
  }
}
