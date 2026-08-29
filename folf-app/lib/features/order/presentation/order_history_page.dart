import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/format/brl.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/features/order/domain/order.dart';
import 'package:folf/features/order/presentation/order_cubit.dart';
import 'package:folf/features/order/presentation/order_status_label.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class OrderHistoryPage extends StatefulWidget {
  const OrderHistoryPage({super.key});

  @override
  State<OrderHistoryPage> createState() => _OrderHistoryPageState();
}

class _OrderHistoryPageState extends State<OrderHistoryPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderCubit>().refreshOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return GsbScaffold(
      body: BlocBuilder<OrderCubit, OrderViewState>(
        builder: (context, state) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  IconButton(
                    tooltip: l10n.back,
                    onPressed: () => context.pop(),
                    icon: const Icon(Icons.arrow_back),
                  ),
                  Expanded(
                    child: Text(l10n.orderHistoryTitle, style: Theme.of(context).textTheme.headlineMedium),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => context.read<OrderCubit>().refreshOrders(),
                  child: state.loading && state.orders.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [
                            SizedBox(height: 200, child: GsbLoading()),
                          ],
                        )
                      : state.orders.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              children: [
                                const SizedBox(height: 48),
                                Center(child: Text(l10n.emptyOrders)),
                              ],
                            )
                          : ListView.separated(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.only(bottom: 24),
                              itemCount: state.orders.length,
                              separatorBuilder: (context, index) => const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final order = state.orders[index];
                                return GsbCard(
                                  onTap: () => _openDetail(context, order),
                                  child: _OrderSummary(order: order),
                                );
                              },
                            ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _openDetail(BuildContext context, CustomerOrder order) async {
    final l10n = AppLocalizations.of(context);
    final detailed = await context.read<OrderCubit>().loadOne(order.id) ?? order;
    if (!context.mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${orderStatusLabel(l10n, detailed.status)} · ${formatBrl(detailed.totalBrl)}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 4),
              Text(
                [
                  if (detailed.tableLabel != null && detailed.tableLabel!.isNotEmpty)
                    l10n.orderAtTable(detailed.tableLabel!),
                  DateFormat.yMMMd(l10n.localeName).add_Hm().format(detailed.createdAt),
                ].join(' · '),
              ),
              const SizedBox(height: 16),
              for (final line in detailed.items)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    '${line.quantity}× ${line.name} · ${itemStatusLabel(l10n, line.status)}',
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _OrderSummary extends StatelessWidget {
  const _OrderSummary({required this.order});

  final CustomerOrder order;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${orderStatusLabel(l10n, order.status)} · ${formatBrl(order.totalBrl)}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 4),
        Text(
          [
            if (order.tableLabel != null && order.tableLabel!.isNotEmpty) l10n.orderAtTable(order.tableLabel!),
            DateFormat.MMMd(l10n.localeName).add_Hm().format(order.createdAt),
          ].join(' · '),
        ),
        const SizedBox(height: 8),
        for (final line in order.items.take(3))
          Text('${line.quantity}× ${line.name} · ${itemStatusLabel(l10n, line.status)}'),
        if (order.items.length > 3) Text('+${order.items.length - 3}'),
      ],
    );
  }
}
