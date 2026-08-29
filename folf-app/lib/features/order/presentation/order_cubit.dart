import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:folf/core/error/failures.dart';
import 'package:folf/features/order/domain/order.dart';
import 'package:folf/features/venue/domain/venue.dart';

class CartState extends Equatable {
  const CartState({this.items = const [], this.notes = ''});

  final List<CartItem> items;
  final String notes;
  double get total => items.fold(0, (sum, item) => sum + item.lineTotal);
  int get count => items.fold(0, (sum, item) => sum + item.quantity);

  @override
  List<Object?> get props => [items, notes];
}

class CartCubit extends Cubit<CartState> {
  CartCubit() : super(const CartState());

  void add(MenuItem item) {
    final next = [...state.items];
    final index = next.indexWhere((row) => row.productId == item.id);
    if (index >= 0) {
      next[index] = next[index].copyWith(quantity: next[index].quantity + 1);
    } else {
      next.add(CartItem(productId: item.id, name: item.name, priceBrl: item.priceBrl));
    }
    emit(CartState(items: next, notes: state.notes));
  }

  void remove(String productId) {
    emit(CartState(items: state.items.where((row) => row.productId != productId).toList(), notes: state.notes));
  }

  void setNotes(String notes) {
    emit(CartState(items: state.items, notes: notes));
  }

  void setItemNotes(String productId, String notes) {
    final next = state.items
        .map((row) => row.productId == productId ? row.copyWith(notes: notes) : row)
        .toList();
    emit(CartState(items: next, notes: state.notes));
  }

  void clear() => emit(const CartState());
}

class OrderViewState extends Equatable {
  const OrderViewState({
    this.loading = true,
    this.submitting = false,
    this.menu,
    this.category,
    this.orders = const [],
    this.message,
    this.placed,
  });

  final bool loading;
  final bool submitting;
  final MenuCatalog? menu;
  final String? category;
  final List<CustomerOrder> orders;
  final String? message;
  final CustomerOrder? placed;

  List<MenuItem> get visible {
    final items = menu?.items ?? const <MenuItem>[];
    if (category == null || category!.isEmpty) return items;
    return items.where((item) => item.category == category).toList();
  }

  OrderViewState copyWith({
    bool? loading,
    bool? submitting,
    MenuCatalog? menu,
    String? category,
    List<CustomerOrder>? orders,
    String? message,
    CustomerOrder? placed,
  }) {
    return OrderViewState(
      loading: loading ?? this.loading,
      submitting: submitting ?? this.submitting,
      menu: menu ?? this.menu,
      category: category ?? this.category,
      orders: orders ?? this.orders,
      message: message,
      placed: placed,
    );
  }

  @override
  List<Object?> get props => [loading, submitting, menu, category, orders, message, placed?.id];
}

class OrderCubit extends Cubit<OrderViewState> {
  OrderCubit({
    required VenueRepository venues,
    required OrderRepository orders,
  })  : _venues = venues,
        _orders = orders,
        super(const OrderViewState());

  final VenueRepository _venues;
  final OrderRepository _orders;

  Future<void> load(String businessId) async {
    emit(state.copyWith(loading: true, message: null));
    try {
      final menu = await _venues.getMenu(businessId);
      final orders = await _orders.listMine();
      emit(
        state.copyWith(
          loading: false,
          menu: menu,
          orders: orders,
          category: menu.categories.isNotEmpty ? menu.categories.first.slug : null,
        ),
      );
    } on Failure catch (error) {
      emit(state.copyWith(loading: false, message: error.message));
    }
  }

  Future<void> refreshOrders() async {
    try {
      final orders = await _orders.listMine();
      emit(state.copyWith(loading: false, orders: orders, message: null));
    } on Failure catch (error) {
      emit(state.copyWith(loading: false, message: error.message));
    }
  }

  void selectCategory(String slug) {
    emit(state.copyWith(category: slug));
  }

  Future<CustomerOrder?> place({
    required String businessId,
    required String tableLabel,
    required List<CartItem> items,
    String? notes,
  }) async {
    emit(state.copyWith(submitting: true, message: null));
    try {
      final placed = await _orders.create(
        businessId: businessId,
        tableLabel: tableLabel,
        items: items,
        notes: notes,
      );
      final orders = await _orders.listMine();
      emit(state.copyWith(submitting: false, placed: placed, orders: orders));
      return placed;
    } on Failure catch (error) {
      emit(state.copyWith(submitting: false, message: error.message));
      return null;
    }
  }

  Future<CustomerOrder?> loadOne(String orderId) async {
    try {
      return await _orders.getById(orderId);
    } on Failure catch (error) {
      emit(state.copyWith(message: error.message));
      return null;
    }
  }
}
