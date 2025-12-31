import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/restaurant_provider.dart';
import '../utils/theme.dart';
import '../models/restaurant.dart';
import 'restaurant_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  List<Restaurant> _searchResults = [];
  bool _hasSearched = false;

  void _search(String query) {
    final restaurants = Provider.of<RestaurantProvider>(
      context,
      listen: false,
    ).restaurants;

    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _hasSearched = false;
      });
      return;
    }

    final results = restaurants.where((r) {
      final nameLower = r.name.toLowerCase();
      final cuisineLower = r.cuisine.join(' ').toLowerCase();
      final queryLower = query.toLowerCase();
      return nameLower.contains(queryLower) ||
          cuisineLower.contains(queryLower);
    }).toList();

    setState(() {
      _searchResults = results;
      _hasSearched = true;
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search'),
        backgroundColor: AppTheme.cardDark,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: _search,
              decoration: InputDecoration(
                hintText: 'Search restaurants, cuisines...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _search('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.cardDark,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Results
          Expanded(
            child: _hasSearched
                ? _searchResults.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text('🔍', style: TextStyle(fontSize: 64)),
                              const SizedBox(height: 16),
                              const Text('No results found'),
                              Text(
                                'Try a different search term',
                                style: TextStyle(color: AppTheme.textGrey),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _searchResults.length,
                          itemBuilder: (ctx, i) {
                            final restaurant = _searchResults[i];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              color: AppTheme.cardDark,
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: AppTheme.primaryColor
                                      .withOpacity(0.2),
                                  child: const Text('🍽️'),
                                ),
                                title: Text(restaurant.name),
                                subtitle: Text(
                                  restaurant.cuisine.join(', '),
                                  style: TextStyle(color: AppTheme.textGrey),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.star,
                                      color: Colors.amber,
                                      size: 16,
                                    ),
                                    Text(' ${restaurant.rating}'),
                                  ],
                                ),
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
                              ),
                            );
                          },
                        )
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('🔍', style: TextStyle(fontSize: 64)),
                        const SizedBox(height: 16),
                        const Text('Search for restaurants'),
                        Text(
                          'Find your favorite food',
                          style: TextStyle(color: AppTheme.textGrey),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
