import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';

class MenuManagementScreen extends StatefulWidget {
  final String restaurantId;

  const MenuManagementScreen({super.key, required this.restaurantId});

  @override
  State<MenuManagementScreen> createState() => _MenuManagementScreenState();
}

class _MenuManagementScreenState extends State<MenuManagementScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _menuItems = [];
  Map<String, List<dynamic>> _categorizedMenu = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMenu();
  }

  Future<void> _fetchMenu() async {
    setState(() => _isLoading = true);
    try {
      final response = await _api.get(
        '/restaurants/${widget.restaurantId}/menu',
      );
      if (response['success'] == true) {
        final data = response['data'];
        List<dynamic> items = [];

        if (data['items'] != null) {
          items = data['items'];
        } else if (data['menu'] != null && data['menu'] is Map) {
          // Menu is categorized
          final menuMap = data['menu'] as Map<String, dynamic>;
          menuMap.forEach((category, categoryItems) {
            if (categoryItems is List) {
              items.addAll(categoryItems);
            }
          });
          _categorizedMenu = Map<String, List<dynamic>>.from(
            menuMap.map(
              (key, value) => MapEntry(key, List<dynamic>.from(value)),
            ),
          );
        }

        setState(() {
          _menuItems = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching menu: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleAvailability(String itemId, bool isAvailable) async {
    try {
      await _api.put('/menu/$itemId', {'isAvailable': !isAvailable});
      _fetchMenu();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Menu Management'),
        backgroundColor: AppTheme.cardDark,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddItemDialog(),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _categorizedMenu.isNotEmpty
          ? _buildCategorizedMenu()
          : _buildFlatMenu(),
    );
  }

  Widget _buildCategorizedMenu() {
    return RefreshIndicator(
      onRefresh: _fetchMenu,
      child: ListView(
        children: _categorizedMenu.entries.map((entry) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  entry.key,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              ...entry.value.map((item) => _buildMenuItem(item)),
              const Divider(),
            ],
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFlatMenu() {
    if (_menuItems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.restaurant_menu, size: 60, color: Colors.grey[600]),
            const SizedBox(height: 16),
            const Text('No menu items yet'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _showAddItemDialog(),
              icon: const Icon(Icons.add),
              label: const Text('Add First Item'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchMenu,
      child: ListView.builder(
        itemCount: _menuItems.length,
        itemBuilder: (ctx, i) => _buildMenuItem(_menuItems[i]),
      ),
    );
  }

  Widget _buildMenuItem(dynamic item) {
    final name = item['name'] ?? 'Item';
    final price = item['price'] ?? 0;
    final isVeg = item['isVeg'] == true;
    final isAvailable = item['isAvailable'] != false;
    final image = item['image'];
    final id = item['_id'];

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      color: AppTheme.cardDark,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Item Image
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: image != null && image.toString().isNotEmpty
                  ? Image.network(
                      image,
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[800],
                        child: const Icon(Icons.fastfood, color: Colors.grey),
                      ),
                    )
                  : Container(
                      width: 60,
                      height: 60,
                      color: Colors.grey[800],
                      child: const Icon(Icons.fastfood, color: Colors.grey),
                    ),
            ),
            const SizedBox(width: 12),

            // Item Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 14,
                        height: 14,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: isVeg ? Colors.green : Colors.red,
                            width: 1.5,
                          ),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Center(
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isVeg ? Colors.green : Colors.red,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          name,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isAvailable ? Colors.white : Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹$price',
                    style: TextStyle(
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            // Availability Toggle
            Column(
              children: [
                Switch(
                  value: isAvailable,
                  onChanged: (_) => _toggleAvailability(id, isAvailable),
                  activeColor: Colors.green,
                ),
                Text(
                  isAvailable ? 'Available' : 'Unavailable',
                  style: TextStyle(
                    fontSize: 10,
                    color: isAvailable ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showAddItemDialog() {
    final nameController = TextEditingController();
    final priceController = TextEditingController();
    final categoryController = TextEditingController();
    bool isVeg = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.cardDark,
          title: const Text('Add Menu Item'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Item Name'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: priceController,
                  decoration: const InputDecoration(labelText: 'Price (₹)'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: categoryController,
                  decoration: const InputDecoration(labelText: 'Category'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Type: '),
                    ChoiceChip(
                      label: const Text('Veg'),
                      selected: isVeg,
                      onSelected: (_) => setDialogState(() => isVeg = true),
                      selectedColor: Colors.green,
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Non-Veg'),
                      selected: !isVeg,
                      onSelected: (_) => setDialogState(() => isVeg = false),
                      selectedColor: Colors.red,
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                try {
                  await _api.post('/menu', {
                    'restaurant': widget.restaurantId,
                    'name': nameController.text,
                    'price': double.tryParse(priceController.text) ?? 0,
                    'category': categoryController.text.isNotEmpty
                        ? categoryController.text
                        : 'General',
                    'isVeg': isVeg,
                  });
                  Navigator.pop(ctx);
                  _fetchMenu();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
}
