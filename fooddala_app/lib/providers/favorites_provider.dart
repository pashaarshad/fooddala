import 'package:flutter/material.dart';
import '../models/restaurant.dart';

class FavoritesProvider with ChangeNotifier {
  final List<Restaurant> _favorites = [];

  List<Restaurant> get favorites => _favorites;

  bool isFavorite(String restaurantId) {
    return _favorites.any((r) => r.id == restaurantId);
  }

  void toggleFavorite(Restaurant restaurant) {
    final existingIndex = _favorites.indexWhere((r) => r.id == restaurant.id);
    if (existingIndex >= 0) {
      _favorites.removeAt(existingIndex);
    } else {
      _favorites.add(restaurant);
    }
    notifyListeners();
  }

  void removeFavorite(String restaurantId) {
    _favorites.removeWhere((r) => r.id == restaurantId);
    notifyListeners();
  }
}
