import 'package:folf/core/network/api_client.dart';
import 'package:folf/features/order/domain/order.dart';

class OrderRepositoryImpl implements OrderRepository {
  OrderRepositoryImpl(this._api);

  final ApiClient _api;

  @override
  Future<List<CustomerOrder>> listMine() async {
    final json = await _api.getList('/me/orders');
    return json.map((row) => CustomerOrder.fromJson(row as Map<String, dynamic>)).toList();
  }

  @override
  Future<CustomerOrder> getById(String id) async {
    final json = await _api.getMap('/me/orders/$id');
    return CustomerOrder.fromJson(json);
  }

  @override
  Future<CustomerOrder> create({
    required String businessId,
    required String tableLabel,
    required List<CartItem> items,
    String? notes,
  }) async {
    final json = await _api.postMap(
      '/me/venues/$businessId/orders',
      data: {
        'tableLabel': tableLabel,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'items': items
            .map(
              (item) => {
                'productId': item.productId,
                'quantity': item.quantity,
                if (item.notes != null && item.notes!.isNotEmpty) 'notes': item.notes,
              },
            )
            .toList(),
      },
    );
    return CustomerOrder.fromJson(json);
  }

  @override
  Future<CustomerOrder> addItem({
    required String orderId,
    required String productId,
    int quantity = 1,
    String? notes,
  }) async {
    final json = await _api.postMap(
      '/me/orders/$orderId/items',
      data: {
        'productId': productId,
        'quantity': quantity,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
    return CustomerOrder.fromJson(json);
  }
}
