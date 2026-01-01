import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/restaurant_order_provider.dart';
import '../models/order.dart';
import '../utils/theme.dart';
import '../services/api_service.dart';
import 'profile_screen.dart';
import 'menu_management_screen.dart';

class RestaurantDashboardScreen extends StatefulWidget {
  const RestaurantDashboardScreen({super.key});

  @override
  State<RestaurantDashboardScreen> createState() =>
      _RestaurantDashboardScreenState();
}

class _RestaurantDashboardScreenState extends State<RestaurantDashboardScreen> {
  int _currentIndex = 0;
  String? _restaurantId;
  final ApiService _api = ApiService();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<RestaurantOrderProvider>(
        context,
        listen: false,
      ).fetchRestaurantOrders();
      _fetchRestaurantId();
    });
  }

  Future<void> _fetchRestaurantId() async {
    try {
      final response = await _api.get('/restaurants/my-restaurant');
      if (response['success'] == true && response['data'] != null) {
        setState(() {
          _restaurantId = response['data']['_id']?.toString();
        });
      }
    } catch (e) {
      print('Error fetching restaurant: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    final screens = [
      _buildDashboardTab(user?.name ?? 'Restaurant'),
      _restaurantId != null
          ? MenuManagementScreen(restaurantId: _restaurantId!)
          : const Center(child: CircularProgressIndicator()),
      _buildOrdersTab(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        backgroundColor: AppTheme.cardDark,
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.restaurant_menu),
            label: 'Menu',
          ),
          BottomNavigationBarItem(
            icon: Consumer<RestaurantOrderProvider>(
              builder: (ctx, provider, _) {
                final pendingCount = provider.pendingCount;
                return Badge(
                  isLabelVisible: pendingCount > 0,
                  label: Text('$pendingCount'),
                  child: const Icon(Icons.list_alt),
                );
              },
            ),
            label: 'Orders',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardTab(String name) {
    return Consumer<RestaurantOrderProvider>(
      builder: (ctx, provider, _) {
        final todayOrders = provider.orders.length;
        final totalRevenue = provider.orders.fold<double>(
          0,
          (sum, order) => sum + order.total,
        );

        return SafeArea(
          child: RefreshIndicator(
            onRefresh: () => provider.fetchRestaurantOrders(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome, $name',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Restaurant Partner',
                    style: TextStyle(color: AppTheme.primaryColor),
                  ),
                  const SizedBox(height: 24),

                  // Stats Row
                  Row(
                    children: [
                      _buildStatCard(
                        'Total Orders',
                        '$todayOrders',
                        Icons.receipt_long,
                        Colors.blue,
                      ),
                      const SizedBox(width: 16),
                      _buildStatCard(
                        'Revenue',
                        '₹${totalRevenue.toStringAsFixed(0)}',
                        Icons.currency_rupee,
                        Colors.green,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildStatCard(
                        'Pending',
                        '${provider.pendingCount}',
                        Icons.pending_actions,
                        Colors.orange,
                      ),
                      const SizedBox(width: 16),
                      _buildStatCard(
                        'Preparing',
                        '${provider.preparingCount}',
                        Icons.restaurant,
                        Colors.purple,
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  const Text(
                    'Recent Orders',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  if (provider.isLoading)
                    const Center(child: CircularProgressIndicator())
                  else if (provider.orders.isEmpty)
                    Center(
                      child: Column(
                        children: [
                          Icon(Icons.inbox, size: 60, color: Colors.grey[600]),
                          const SizedBox(height: 16),
                          const Text('No orders yet'),
                        ],
                      ),
                    )
                  else
                    ...provider.orders
                        .take(5)
                        .map((order) => _buildOrderCard(order)),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildOrdersTab() {
    return Consumer<RestaurantOrderProvider>(
      builder: (ctx, provider, _) {
        return DefaultTabController(
          length: 4,
          child: Scaffold(
            appBar: AppBar(
              title: const Text('Orders'),
              backgroundColor: AppTheme.cardDark,
              bottom: TabBar(
                indicatorColor: AppTheme.primaryColor,
                labelColor: AppTheme.primaryColor,
                unselectedLabelColor: Colors.grey,
                tabs: [
                  Tab(text: 'All (${provider.orders.length})'),
                  Tab(text: 'Pending (${provider.pendingCount})'),
                  Tab(text: 'Preparing (${provider.preparingCount})'),
                  Tab(text: 'Ready (${provider.readyCount})'),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                _buildOrderList(provider, 'all'),
                _buildOrderList(provider, 'pending'),
                _buildOrderList(provider, 'preparing'),
                _buildOrderList(provider, 'ready'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildOrderList(RestaurantOrderProvider provider, String status) {
    final orders = provider.getOrdersByStatus(status);

    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 60, color: Colors.grey[600]),
            const SizedBox(height: 16),
            Text('No $status orders'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => provider.fetchRestaurantOrders(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (ctx, i) => _buildOrderCard(orders[i]),
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    final provider = Provider.of<RestaurantOrderProvider>(
      context,
      listen: false,
    );

    Color statusColor;
    switch (order.status) {
      case 'pending':
        statusColor = Colors.orange;
        break;
      case 'confirmed':
      case 'preparing':
        statusColor = Colors.blue;
        break;
      case 'ready':
        statusColor = Colors.green;
        break;
      case 'delivered':
        statusColor = Colors.grey;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Card(
      color: AppTheme.cardDark,
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '#${order.orderNumber}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    order.statusDisplay,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Items
            ...order.items.map(
              (item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text(
                  '${item.quantity}x ${item.name}',
                  style: TextStyle(color: AppTheme.textGrey),
                ),
              ),
            ),

            const Divider(height: 24),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '₹${order.total.toStringAsFixed(0)}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppTheme.primaryColor,
                  ),
                ),
                Text(
                  order.paymentMethod == 'cod' ? 'Cash' : 'Paid',
                  style: TextStyle(color: AppTheme.textGrey),
                ),
              ],
            ),

            // Action Buttons
            if (order.status == 'pending' ||
                order.status == 'preparing' ||
                order.status == 'confirmed')
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Row(
                  children: [
                    if (order.status == 'pending')
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            await provider.updateOrderStatus(
                              order.id,
                              'confirmed',
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                          ),
                          child: const Text(
                            'Accept',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                    if (order.status == 'confirmed')
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            await provider.updateOrderStatus(
                              order.id,
                              'preparing',
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.purple,
                          ),
                          child: const Text(
                            'Start Preparing',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                    if (order.status == 'preparing')
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () async {
                            await provider.updateOrderStatus(order.id, 'ready');
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                          ),
                          child: const Text(
                            'Mark Ready',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    title,
                    style: TextStyle(color: AppTheme.textGrey, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
