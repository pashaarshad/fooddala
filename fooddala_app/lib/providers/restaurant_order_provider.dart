import 'package:flutter/material.dart';
import '../models/order.dart';
import '../services/api_service.dart';

class RestaurantOrderProvider with ChangeNotifier {
  List<Order> _orders = [];
  Map<String, dynamic> _stats = {};
  bool _isLoading = false;
  final ApiService _api = ApiService();

  List<Order> get orders => _orders;
  Map<String, dynamic> get stats => _stats;
  bool get isLoading => _isLoading;

  // Get orders by status
  List<Order> getOrdersByStatus(String status) {
    if (status == 'all') return _orders;
    return _orders.where((o) => o.status == status).toList();
  }

  // Pending orders count
  int get pendingCount => _orders.where((o) => o.status == 'pending').length;
  int get preparingCount =>
      _orders.where((o) => o.status == 'preparing').length;
  int get readyCount => _orders.where((o) => o.status == 'ready').length;

  Future<void> fetchRestaurantOrders() async {
    _isLoading = true;
    notifyListeners();

    try {
      print('Fetching restaurant orders...');
      final response = await _api.get('/orders/restaurant/orders');
      print('Response: $response');

      if (response['success'] == true) {
        List<dynamic> data = [];
        if (response['data'] is List) {
          data = response['data'];
        } else if (response['data'] is Map) {
          data = response['data']['orders'] ?? [];
        }
        print('Orders count: ${data.length}');
        _orders = data.whereType<Map<String, dynamic>>().map((json) {
          try {
            return Order.fromJson(json);
          } catch (e) {
            print('Error parsing order: $e');
            print('Order data: $json');
            rethrow;
          }
        }).toList();
        print('Parsed orders: ${_orders.length}');
      } else {
        print('API returned success: false - ${response['message']}');
      }
    } catch (e) {
      print('Error fetching restaurant orders: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchRestaurantStats() async {
    try {
      final response = await _api.get('/orders/restaurant/stats');
      if (response['success'] == true && response['data'] != null) {
        _stats = response['data'];
        notifyListeners();
      }
    } catch (e) {
      print('Error fetching restaurant stats: $e');
    }
  }

  Future<bool> updateOrderStatus(String orderId, String status) async {
    try {
      final response = await _api.put('/orders/$orderId/status', {
        'status': status,
      });
      if (response['success'] == true) {
        // Update local order
        final index = _orders.indexWhere((o) => o.id == orderId);
        if (index != -1) {
          await fetchRestaurantOrders(); // Refresh orders
        }
        return true;
      }
    } catch (e) {
      print('Error updating order status: $e');
    }
    return false;
  }
}
