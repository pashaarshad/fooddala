import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/restaurant_provider.dart';
import '../utils/theme.dart';
import 'restaurant_detail_screen.dart';

class CategoryScreen extends StatelessWidget {
  final String category;
  final String emoji;

  const CategoryScreen({
    super.key,
    required this.category,
    required this.emoji,
  });

  @override
  Widget build(BuildContext context) {
    final restaurants = Provider.of<RestaurantProvider>(context).restaurants;

    // Filter restaurants by category/cuisine
    final filtered = restaurants.where((r) {
      return r.cuisine.any(
        (c) => c.toLowerCase().contains(category.toLowerCase()),
      );
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [Text(emoji), const SizedBox(width: 8), Text(category)],
        ),
        backgroundColor: AppTheme.cardDark,
      ),
      body: filtered.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(emoji, style: const TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  Text('No $category restaurants found'),
                  Text(
                    'Check back later!',
                    style: TextStyle(color: AppTheme.textGrey),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (ctx, i) {
                final restaurant = filtered[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  color: AppTheme.cardDark,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: InkWell(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (ctx) => RestaurantDetailScreen(
                            restaurantId: restaurant.id,
                            restaurantName: restaurant.name,
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.grey[800],
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Center(
                              child: Text(
                                '🍽️',
                                style: TextStyle(fontSize: 32),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  restaurant.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  restaurant.cuisine.join(', '),
                                  style: TextStyle(
                                    color: AppTheme.textGrey,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.star,
                                      color: Colors.amber,
                                      size: 16,
                                    ),
                                    Text(' ${restaurant.rating}'),
                                    const SizedBox(width: 16),
                                    Icon(
                                      Icons.access_time,
                                      size: 16,
                                      color: AppTheme.textGrey,
                                    ),
                                    Text(
                                      ' ${restaurant.deliveryTime} min',
                                      style: TextStyle(
                                        color: AppTheme.textGrey,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.chevron_right, color: AppTheme.textGrey),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
