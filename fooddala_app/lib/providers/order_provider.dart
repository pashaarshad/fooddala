import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class OrderProvider with ChangeNotifier {
  List<Order> _orders = [];
  Order? _currentOrder;
  bool _isLoading = false;
  final ApiService _api = ApiService();

  List<Order> get orders => _orders;
  Order? get currentOrder => _currentOrder;
  bool get isLoading => _isLoading;

  Future<void> fetchOrders() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.get('/orders');
      if (response['success'] == true) {
        List<dynamic> data = [];
        if (response['data'] is List) {
          data = response['data'];
        } else if (response['data'] is Map) {
          data = response['data']['orders'] ?? [];
        }
        _orders = data
            .whereType<Map<String, dynamic>>()
            .map((json) => Order.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error fetching orders: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Order?> createOrder({
    required String restaurantId,
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> deliveryAddress,
    required String paymentMethod,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Ensure all item IDs are strings
      final sanitizedItems = items.map((item) {
        return {
          'menuItemId': item['menuItemId'].toString(),
          'quantity': int.tryParse(item['quantity'].toString()) ?? 1,
        };
      }).toList();

      final response = await _api.post('/orders', {
        'restaurantId': restaurantId.toString(),
        'items': sanitizedItems,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod.toString(),
      });

      if (response['success'] == true) {
        // Handle different response structures
        dynamic orderData;
        if (response['data'] is Map) {
          orderData = response['data']['order'] ?? response['data'];
        } else {
          orderData = response['data'];
        }

        if (orderData != null && orderData is Map<String, dynamic>) {
          final order = Order.fromJson(orderData);
          _currentOrder = order;
          _orders.insert(0, order);
          notifyListeners();
          return order;
        }
      }
      throw Exception(response['message'] ?? 'Failed to create order');
    } catch (e) {
      print('Error creating order: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchOrderById(String orderId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.get('/orders/$orderId');
      if (response['success'] == true) {
        dynamic orderData;
        if (response['data'] is Map) {
          orderData = response['data']['order'] ?? response['data'];
        } else {
          orderData = response['data'];
        }
        if (orderData is Map<String, dynamic>) {
          _currentOrder = Order.fromJson(orderData);
        }
      }
    } catch (e) {
      print('Error fetching order: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearCurrentOrder() {
    _currentOrder = null;
    notifyListeners();
  }
}
