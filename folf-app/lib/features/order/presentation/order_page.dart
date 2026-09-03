import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/format/brl.dart';
import 'package:folf/core/widgets/gsb_widgets.dart';
import 'package:folf/core/widgets/menu_image.dart';
import 'package:folf/features/order/domain/order.dart';
import 'package:folf/features/order/presentation/order_cubit.dart';
import 'package:folf/features/order/presentation/order_status_label.dart';
import 'package:folf/features/venue/domain/venue.dart';
import 'package:folf/features/venue/presentation/venue_session_cubit.dart';
import 'package:folf/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class OrderPage extends StatefulWidget {
  const OrderPage({super.key});

  @override
  State<OrderPage> createState() => _OrderPageState();
}

class _OrderPageState extends State<OrderPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final venue = context.read<VenueSessionCubit>().state.venue;
      if (venue != null) context.read<OrderCubit>().load(venue.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final session = context.watch<VenueSessionCubit>().state;
    final venue = session.venue;
    if (venue == null) {
      return GsbScaffold(body: Center(child: Text(l10n.noVenues)));
    }

    return GsbScaffold(
      floating: BlocBuilder<CartCubit, CartState>(
        builder: (context, cart) {
          if (cart.items.isEmpty) return const SizedBox.shrink();
          return FloatingActionButton.extended(
            onPressed: () => _openCart(context, venue, session.tableLabel, l10n),
            label: Text('${l10n.cart} · ${formatBrl(cart.total)}'),
            icon: Badge(label: Text('${cart.count}'), child: const Icon(Icons.shopping_bag_outlined)),
          );
        },
      ),
      body: BlocConsumer<OrderCubit, OrderViewState>(
        listener: (context, state) {
          if (state.message != null) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(state.message!)));
          }
        },
        builder: (context, state) {
          if (state.loading && state.menu == null) return const GsbLoading();
          return RefreshIndicator(
            onRefresh: () => context.read<OrderCubit>().load(venue.id),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.only(bottom: 140),
              children: [
              Text(l10n.orderTitle, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              if (session.tableLabel == null)
                GsbCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.needTable),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: () => context.go('/app/qr'), child: Text(l10n.scanTable)),
                      TextButton(onPressed: () => _typeTable(context, l10n), child: Text(l10n.typeTable)),
                    ],
                  ),
                )
              else
                GsbCard(
                  child: Row(
                    children: [
                      Expanded(child: Text(l10n.tableActive(session.tableLabel!))),
                      TextButton(onPressed: () => context.read<VenueSessionCubit>().clearTable(), child: Text(l10n.changeTable)),
                    ],
                  ),
                ),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final category in state.menu?.categories ?? const <MenuCategory>[])
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: GsbChip(
                          label: category.name,
                          selected: state.category == category.slug,
                          onTap: () => context.read<OrderCubit>().selectCategory(category.slug),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (state.visible.isEmpty) Text(l10n.emptyMenu),
              for (final item in state.visible)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GsbCard(
                    child: Row(
                      children: [
                        MenuImage(src: item.imageSrc, size: 72),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                              Text(item.description, maxLines: 2, overflow: TextOverflow.ellipsis),
                              Text(formatBrl(item.priceBrl)),
                            ],
                          ),
                        ),
                        IconButton.filledTonal(
                          onPressed: session.tableLabel == null ? null : () => context.read<CartCubit>().add(item),
                          icon: const Icon(Icons.add),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: Text(l10n.myOrders, style: Theme.of(context).textTheme.titleLarge)),
                  TextButton(
                    onPressed: () => context.push('/app/order/history'),
                    child: Text(l10n.seeAllOrders),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (state.orders.isEmpty) Text(l10n.emptyOrders),
              for (final order in state.orders.take(5))
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: GsbCard(
                    onTap: () => context.push('/app/order/history'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('${order.tableLabel ?? ''} · ${formatBrl(order.totalBrl)}'),
                        Text(orderStatusLabel(l10n, order.status)),
                        for (final line in order.items)
                          Text('${line.quantity}× ${line.name} · ${itemStatusLabel(l10n, line.status)}'),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          );
        },
      ),
    );
  }

  Future<void> _typeTable(BuildContext context, AppLocalizations l10n) async {
    final controller = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      useRootNavigator: true,
      builder: (context) {
        return Padding(
          padding: EdgeInsets.fromLTRB(20, 0, 20, 32 + MediaQuery.viewInsetsOf(context).bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: controller, decoration: InputDecoration(labelText: l10n.tableHint)),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () {
                  context.read<VenueSessionCubit>().setTable(controller.text.trim());
                  Navigator.pop(context);
                },
                child: Text(l10n.confirm),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openCart(BuildContext context, Venue venue, String? table, AppLocalizations l10n) async {
    final cartCubit = context.read<CartCubit>();
    final orderCubit = context.read<OrderCubit>();
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      useRootNavigator: true,
      builder: (context) {
        return MultiBlocProvider(
          providers: [
            BlocProvider.value(value: cartCubit),
            BlocProvider.value(value: orderCubit),
          ],
          child: _CartSheet(venue: venue, table: table, l10n: l10n),
        );
      },
    );
  }
}

class _CartSheet extends StatefulWidget {
  const _CartSheet({required this.venue, required this.table, required this.l10n});

  final Venue venue;
  final String? table;
  final AppLocalizations l10n;

  @override
  State<_CartSheet> createState() => _CartSheetState();
}

class _CartSheetState extends State<_CartSheet> {
  late final TextEditingController _orderNotes;
  final Map<String, TextEditingController> _itemNotes = {};
  bool _includeServiceCharge = false;

  @override
  void initState() {
    super.initState();
    final cart = context.read<CartCubit>().state;
    _orderNotes = TextEditingController(text: cart.notes);
    for (final item in cart.items) {
      _itemNotes[item.productId] = TextEditingController(text: item.notes ?? '');
    }
  }

  @override
  void dispose() {
    _orderNotes.dispose();
    for (final controller in _itemNotes.values) {
      controller.dispose();
    }
    super.dispose();
  }

  TextEditingController _controllerFor(CartItem item) {
    return _itemNotes.putIfAbsent(
      item.productId,
      () => TextEditingController(text: item.notes ?? ''),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = widget.l10n;
    final maxHeight = MediaQuery.sizeOf(context).height * 0.75;

    return BlocBuilder<CartCubit, CartState>(
      buildWhen: (previous, current) => previous.items != current.items || previous.total != current.total,
      builder: (context, cart) {
        return SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxHeight),
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(20, 0, 20, 24 + MediaQuery.viewInsetsOf(context).bottom),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(l10n.cart, style: Theme.of(context).textTheme.titleLarge),
                  if (cart.items.isEmpty) Text(l10n.emptyCart),
                  for (final item in cart.items) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(item.name),
                      subtitle: Text('${item.quantity} × ${formatBrl(item.priceBrl)}'),
                      trailing: IconButton(
                        onPressed: () => context.read<CartCubit>().remove(item.productId),
                        icon: const Icon(Icons.close),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: TextField(
                        controller: _controllerFor(item),
                        decoration: InputDecoration(
                          labelText: l10n.itemNotes,
                          isDense: true,
                        ),
                        maxLines: 2,
                        textInputAction: TextInputAction.next,
                        onChanged: (value) => context.read<CartCubit>().setItemNotes(item.productId, value),
                      ),
                    ),
                  ],
                  if (cart.items.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _orderNotes,
                      decoration: InputDecoration(labelText: l10n.notes),
                      maxLines: 3,
                      textInputAction: TextInputAction.done,
                      onChanged: (value) => context.read<CartCubit>().setNotes(value),
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      value: _includeServiceCharge,
                      onChanged: (value) => setState(() => _includeServiceCharge = value ?? false),
                      title: Text(l10n.serviceCharge10),
                    ),
                    if (_includeServiceCharge) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(l10n.orderSubtotal, style: Theme.of(context).textTheme.bodySmall),
                          Text(formatBrl(cart.total), style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(l10n.serviceChargeLabel, style: Theme.of(context).textTheme.bodySmall),
                          Text(
                            formatBrl(_serviceCharge(cart.total)),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                    ],
                    const SizedBox(height: 4),
                  ],
                  FilledButton(
                    onPressed: widget.table == null || cart.items.isEmpty
                        ? null
                        : () async {
                            final items = cart.items
                                .map(
                                  (item) => item.copyWith(
                                    notes: _controllerFor(item).text.trim(),
                                  ),
                                )
                                .toList();
                            final orderNotes = _orderNotes.text.trim();
                            final placed = await context.read<OrderCubit>().place(
                                  businessId: widget.venue.id,
                                  tableLabel: widget.table!,
                                  items: items,
                                  notes: orderNotes.isEmpty ? null : orderNotes,
                                  includeServiceCharge: _includeServiceCharge,
                                );
                            if (placed != null && context.mounted) {
                              context.read<CartCubit>().clear();
                              Navigator.pop(context);
                            }
                          },
                    child: Text(
                      '${l10n.placeOrder} · ${formatBrl(_payableTotal(cart.total))}',
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  double _serviceCharge(double subtotal) => (subtotal * 0.1 * 100).round() / 100;

  double _payableTotal(double subtotal) {
    if (!_includeServiceCharge) return subtotal;
    return ((subtotal + _serviceCharge(subtotal)) * 100).round() / 100;
  }
}
