import 'package:flutter/material.dart';
import '../models/restaurant.dart';
import '../models/menu_item.dart';
import '../services/api_service.dart';

class RestaurantProvider with ChangeNotifier {
  List<Restaurant> _restaurants = [];
  List<MenuItem> _menuItems = [];
  bool _isLoading = false;
  final ApiService _api = ApiService();

  List<Restaurant> get restaurants => _restaurants;
  List<MenuItem> get menuItems => _menuItems;
  bool get isLoading => _isLoading;

  Future<void> fetchRestaurants() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.get('/restaurants');
      if (response['success']) {
        final List<dynamic> data = response['data']['restaurants'];
        _restaurants = data.map((json) => Restaurant.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching restaurants: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMenu(String restaurantId) async {
    _isLoading = true;
    // Clear previous menu to avoid flash of old content
    _menuItems = [];
    notifyListeners();

    try {
      final response = await _api.get('/restaurants/$restaurantId/menu');
      if (response['success']) {
        final List<dynamic> data = response['data'];
        _menuItems = data.map((json) => MenuItem.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching menu: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
