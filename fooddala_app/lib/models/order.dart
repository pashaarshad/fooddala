class Order {
  final String id;
  final String orderNumber;
  final String status;
  final double total;
  final double deliveryFee;
  final String paymentMethod;
  final String? paymentStatus;
  final DateTime createdAt;
  final OrderRestaurant? restaurant;
  final List<OrderItem> items;
  final DeliveryAddress? deliveryAddress;
  final Driver? driver;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.total,
    required this.deliveryFee,
    required this.paymentMethod,
    this.paymentStatus,
    required this.createdAt,
    this.restaurant,
    required this.items,
    this.deliveryAddress,
    this.driver,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    // Handle restaurant - can be string ID or object
    OrderRestaurant? restaurant;
    if (json['restaurant'] != null) {
      if (json['restaurant'] is Map) {
        restaurant = OrderRestaurant.fromJson(json['restaurant']);
      } else {
        // Restaurant is just an ID string
        restaurant = OrderRestaurant(
          id: json['restaurant'].toString(),
          name: 'Restaurant',
        );
      }
    }

    return Order(
      id: (json['_id'] ?? '').toString(),
      orderNumber: (json['orderNumber'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      total: double.tryParse((json['total'] ?? 0).toString()) ?? 0.0,
      deliveryFee:
          double.tryParse((json['deliveryFee'] ?? 0).toString()) ?? 0.0,
      paymentMethod: (json['paymentMethod'] ?? 'cod').toString(),
      paymentStatus: json['paymentStatus']?.toString(),
      createdAt:
          DateTime.tryParse((json['createdAt'] ?? '').toString()) ??
          DateTime.now(),
      restaurant: restaurant,
      items:
          (json['items'] as List<dynamic>?)
              ?.map((item) => OrderItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      deliveryAddress:
          json['deliveryAddress'] != null && json['deliveryAddress'] is Map
          ? DeliveryAddress.fromJson(json['deliveryAddress'])
          : null,
      driver: json['driver'] != null && json['driver'] is Map
          ? Driver.fromJson(json['driver'])
          : null,
    );
  }

  String get statusDisplay {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'picked_up':
        return 'Out for Delivery';
      case 'on_the_way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }
}

class OrderItem {
  final String id;
  final String name;
  final double price;
  final int quantity;

  OrderItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    // menuItem can be either an ObjectId string or a full object
    String itemId = '';
    String itemName = 'Item';

    if (json['menuItem'] != null) {
      if (json['menuItem'] is Map) {
        itemId = (json['menuItem']['_id'] ?? '').toString();
        itemName = (json['menuItem']['name'] ?? json['name'] ?? 'Item')
            .toString();
      } else {
        itemId = json['menuItem'].toString();
        itemName = (json['name'] ?? 'Item').toString();
      }
    } else {
      itemId = (json['_id'] ?? '').toString();
      itemName = (json['name'] ?? 'Item').toString();
    }

    return OrderItem(
      id: itemId,
      name: itemName,
      price: double.tryParse((json['price'] ?? 0).toString()) ?? 0.0,
      quantity: int.tryParse((json['quantity'] ?? 1).toString()) ?? 1,
    );
  }
}

class OrderRestaurant {
  final String id;
  final String name;
  final String? image;

  OrderRestaurant({required this.id, required this.name, this.image});

  factory OrderRestaurant.fromJson(Map<String, dynamic> json) {
    return OrderRestaurant(
      id: (json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      image: (json['logo'] ?? json['image'])?.toString(),
    );
  }
}

class DeliveryAddress {
  final String street;
  final String city;
  final String state;
  final String pincode;

  DeliveryAddress({
    required this.street,
    required this.city,
    required this.state,
    required this.pincode,
  });

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) {
    return DeliveryAddress(
      street: (json['street'] ?? '').toString(),
      city: (json['city'] ?? '').toString(),
      state: (json['state'] ?? '').toString(),
      pincode: (json['pincode'] ?? '').toString(),
    );
  }

  String get fullAddress => '$street, $city, $state - $pincode';
}

class Driver {
  final String id;
  final String name;
  final String? phone;

  Driver({required this.id, required this.name, this.phone});

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: (json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      phone: json['phone']?.toString(),
    );
  }
}
