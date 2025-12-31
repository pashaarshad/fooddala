import 'package:flutter/material.dart';
import '../models/menu_item.dart';

class CartItem {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final String restaurantId;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.restaurantId,
  });
}

class CartProvider with ChangeNotifier {
  Map<String, CartItem> _items = {};
  String? _currentRestaurantId;

  Map<String, CartItem> get items => _items;

  int get itemCount {
    return _items.length;
  }

  double get totalAmount {
    var total = 0.0;
    _items.forEach((key, cartItem) {
      total += cartItem.price * cartItem.quantity;
    });
    return total;
  }

  void addItem(
    String productId,
    double price,
    String title,
    String restaurantId,
  ) {
    // If adding item from a different restaurant, clear cart first
    if (_currentRestaurantId != null && _currentRestaurantId != restaurantId) {
      // Ideally ask for confirmation, but for now we'll auto-clear or just throw error.
      // Let's safe clear for simplicity in MVP.
      _items = {};
    }
    _currentRestaurantId = restaurantId;

    if (_items.containsKey(productId)) {
      // increase quantity
      _items.update(
        productId,
        (existingCartItem) => CartItem(
          id: existingCartItem.id,
          name: existingCartItem.name,
          price: existingCartItem.price,
          quantity: existingCartItem.quantity + 1,
          restaurantId: existingCartItem.restaurantId,
        ),
      );
    } else {
      _items.putIfAbsent(
        productId,
        () => CartItem(
          id: DateTime.now().toString(),
          name: title,
          price: price,
          quantity: 1,
          restaurantId: restaurantId,
        ),
      );
    }
    notifyListeners();
  }

  void removeSingleItem(String productId) {
    if (!_items.containsKey(productId)) {
      return;
    }
    if (_items[productId]!.quantity > 1) {
      _items.update(
        productId,
        (existingCartItem) => CartItem(
          id: existingCartItem.id,
          name: existingCartItem.name,
          price: existingCartItem.price,
          quantity: existingCartItem.quantity - 1,
          restaurantId: existingCartItem.restaurantId,
        ),
      );
    } else {
      _items.remove(productId);
      if (_items.isEmpty) {
        _currentRestaurantId = null;
      }
    }
    notifyListeners();
  }

  void clear() {
    _items = {};
    _currentRestaurantId = null;
    notifyListeners();
  }
}
