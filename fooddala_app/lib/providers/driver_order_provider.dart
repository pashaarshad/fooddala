import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class DriverOrderProvider with ChangeNotifier {
  List<Order> _myOrders = [];
  List<Order> _availableOrders = [];
  bool _isLoading = false;
  final ApiService _api = ApiService();

  List<Order> get myOrders => _myOrders;
  List<Order> get availableOrders => _availableOrders;
  bool get isLoading => _isLoading;

  // Active delivery (orders being delivered)
  List<Order> get activeDeliveries => _myOrders
      .where((o) => o.status == 'picked_up' || o.status == 'on_the_way')
      .toList();

  Future<void> fetchMyOrders() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.get('/orders/driver/orders');
      if (response['success'] == true) {
        List<dynamic> data = [];
        if (response['data'] is List) {
          data = response['data'];
        } else if (response['data'] is Map) {
          data = response['data']['orders'] ?? [];
        }
        _myOrders = data
            .whereType<Map<String, dynamic>>()
            .map((json) => Order.fromJson(json))
            .toList();
      }
    } catch (e) {
      print('Error fetching driver orders: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAvailableOrders() async {
    try {
      final response = await _api.get('/orders/driver/available');
      if (response['success'] == true) {
        List<dynamic> data = [];
        if (response['data'] is List) {
          data = response['data'];
        } else if (response['data'] is Map) {
          data = response['data']['orders'] ?? [];
        }
        _availableOrders = data
            .whereType<Map<String, dynamic>>()
            .map((json) => Order.fromJson(json))
            .toList();
        notifyListeners();
      }
    } catch (e) {
      print('Error fetching available orders: $e');
    }
  }

  Future<bool> acceptOrder(String orderId) async {
    try {
      final response = await _api.post('/orders/$orderId/accept', {});
      if (response['success'] == true) {
        await fetchMyOrders();
        await fetchAvailableOrders();
        return true;
      }
    } catch (e) {
      print('Error accepting order: $e');
    }
    return false;
  }

  Future<bool> updateOrderStatus(String orderId, String status) async {
    try {
      final response = await _api.put('/orders/$orderId/status', {
        'status': status,
      });
      if (response['success'] == true) {
        await fetchMyOrders();
        return true;
      }
    } catch (e) {
      print('Error updating order status: $e');
    }
    return false;
  }
}
