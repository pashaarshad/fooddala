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
      if (response['success']) {
        final List<dynamic> data =
            response['data']['orders'] ?? response['data'] ?? [];
        _orders = data.map((json) => Order.fromJson(json)).toList();
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
      final response = await _api.post('/orders', {
        'restaurantId': restaurantId,
        'items': items,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod,
      });

      if (response['success']) {
        final order = Order.fromJson(response['data']['order']);
        _currentOrder = order;
        _orders.insert(0, order);
        notifyListeners();
        return order;
      }
    } catch (e) {
      print('Error creating order: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return null;
  }

  Future<void> fetchOrderById(String orderId) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.get('/orders/$orderId');
      if (response['success']) {
        _currentOrder = Order.fromJson(response['data']['order']);
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
