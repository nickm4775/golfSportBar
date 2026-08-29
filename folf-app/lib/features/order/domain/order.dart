class OrderLine {
  const OrderLine({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPriceBrl,
    required this.status,
    this.notes,
  });

  final String id;
  final String name;
  final int quantity;
  final double unitPriceBrl;
  final String status;
  final String? notes;

  factory OrderLine.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    return OrderLine(
      id: json['id'] as String,
      name: (product?['namePt'] ?? product?['name'] ?? '') as String,
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPriceBrl: (json['unitPriceBrl'] as num?)?.toDouble() ?? 0,
      status: json['status'] as String? ?? 'PENDING',
      notes: json['notes'] as String?,
    );
  }
}

class CustomerOrder {
  const CustomerOrder({
    required this.id,
    required this.businessId,
    required this.status,
    required this.tableLabel,
    required this.totalBrl,
    required this.items,
    required this.createdAt,
  });

  final String id;
  final String businessId;
  final String status;
  final String? tableLabel;
  final double totalBrl;
  final List<OrderLine> items;
  final DateTime createdAt;

  bool get isActive => status == 'OPEN' || status == 'IN_PROGRESS' || status == 'DRAFT';

  factory CustomerOrder.fromJson(Map<String, dynamic> json) {
    return CustomerOrder(
      id: json['id'] as String,
      businessId: json['businessId'] as String,
      status: json['status'] as String,
      tableLabel: json['tableLabel'] as String?,
      totalBrl: (json['totalBrl'] as num?)?.toDouble() ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((row) => OrderLine.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class CartItem {
  const CartItem({required this.productId, required this.name, required this.priceBrl, this.quantity = 1, this.notes});

  final String productId;
  final String name;
  final double priceBrl;
  final int quantity;
  final String? notes;

  CartItem copyWith({int? quantity, String? notes}) {
    return CartItem(
      productId: productId,
      name: name,
      priceBrl: priceBrl,
      quantity: quantity ?? this.quantity,
      notes: notes ?? this.notes,
    );
  }

  double get lineTotal => priceBrl * quantity;
}

abstract class OrderRepository {
  Future<List<CustomerOrder>> listMine();
  Future<CustomerOrder> getById(String id);
  Future<CustomerOrder> create({
    required String businessId,
    required String tableLabel,
    required List<CartItem> items,
    String? notes,
  });
  Future<CustomerOrder> addItem({
    required String orderId,
    required String productId,
    int quantity = 1,
    String? notes,
  });
}
