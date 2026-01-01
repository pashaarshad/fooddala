import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/driver_order_provider.dart';
import '../models/order.dart';
import '../utils/theme.dart';
import 'profile_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  int _currentIndex = 0;
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final provider = Provider.of<DriverOrderProvider>(context, listen: false);
      provider.fetchMyOrders();
      provider.fetchAvailableOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;

    final screens = [
      _buildHomeTab(user?.name ?? 'Driver'),
      _buildAvailableOrdersTab(),
      _buildMyOrdersTab(),
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
          const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(
            icon: Consumer<DriverOrderProvider>(
              builder: (ctx, provider, _) {
                final count = provider.availableOrders.length;
                return Badge(
                  isLabelVisible: count > 0,
                  label: Text('$count'),
                  child: const Icon(Icons.delivery_dining),
                );
              },
            ),
            label: 'Available',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.list_alt),
            label: 'My Orders',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab(String name) {
    return Consumer<DriverOrderProvider>(
      builder: (ctx, provider, _) {
        final activeDeliveries = provider.activeDeliveries;

        return SafeArea(
          child: RefreshIndicator(
            onRefresh: () async {
              await provider.fetchMyOrders();
              await provider.fetchAvailableOrders();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: AppTheme.cardDark,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, $name',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              _isOnline ? 'You are Online' : 'You are Offline',
                              style: TextStyle(
                                color: _isOnline ? Colors.green : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                        Switch(
                          value: _isOnline,
                          onChanged: (val) => setState(() => _isOnline = val),
                          activeColor: AppTheme.primaryColor,
                        ),
                      ],
                    ),
                  ),

                  // Stats
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        _buildStatCard(
                          'Available',
                          '${provider.availableOrders.length}',
                          Icons.delivery_dining,
                          Colors.orange,
                        ),
                        const SizedBox(width: 16),
                        _buildStatCard(
                          'Active',
                          '${activeDeliveries.length}',
                          Icons.local_shipping,
                          Colors.blue,
                        ),
                      ],
                    ),
                  ),

                  // Active Delivery
                  if (activeDeliveries.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Active Delivery',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildOrderCard(
                            activeDeliveries.first,
                            isActive: true,
                          ),
                        ],
                      ),
                    ),

                  // No active delivery message
                  if (activeDeliveries.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        children: [
                          Icon(
                            Icons.motorcycle,
                            size: 80,
                            color: AppTheme.textGrey.withOpacity(0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _isOnline
                                ? 'No active delivery\nCheck available orders!'
                                : 'Go online to start receiving orders',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: AppTheme.textGrey),
                          ),
                          if (_isOnline && provider.availableOrders.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 16),
                              child: ElevatedButton(
                                onPressed: () =>
                                    setState(() => _currentIndex = 1),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryColor,
                                ),
                                child: Text(
                                  'View ${provider.availableOrders.length} Available Orders',
                                  style: const TextStyle(color: Colors.white),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAvailableOrdersTab() {
    return Consumer<DriverOrderProvider>(
      builder: (ctx, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.availableOrders.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle, size: 60, color: Colors.green[300]),
                const SizedBox(height: 16),
                const Text('No orders available for pickup'),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () => provider.fetchAvailableOrders(),
                  child: const Text('Refresh'),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => provider.fetchAvailableOrders(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.availableOrders.length,
            itemBuilder: (ctx, i) => _buildOrderCard(
              provider.availableOrders[i],
              showAcceptButton: true,
            ),
          ),
        );
      },
    );
  }

  Widget _buildMyOrdersTab() {
    return Consumer<DriverOrderProvider>(
      builder: (ctx, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.myOrders.isEmpty) {
          return const Center(child: Text('No orders yet'));
        }

        return RefreshIndicator(
          onRefresh: () => provider.fetchMyOrders(),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.myOrders.length,
            itemBuilder: (ctx, i) => _buildOrderCard(provider.myOrders[i]),
          ),
        );
      },
    );
  }

  Widget _buildOrderCard(
    Order order, {
    bool showAcceptButton = false,
    bool isActive = false,
  }) {
    final provider = Provider.of<DriverOrderProvider>(context, listen: false);

    return Card(
      color: isActive
          ? AppTheme.primaryColor.withOpacity(0.1)
          : AppTheme.cardDark,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isActive
            ? BorderSide(color: AppTheme.primaryColor, width: 2)
            : BorderSide.none,
      ),
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
                    color: _getStatusColor(order.status).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    order.statusDisplay,
                    style: TextStyle(
                      color: _getStatusColor(order.status),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Restaurant
            Row(
              children: [
                Icon(Icons.restaurant, size: 16, color: AppTheme.textGrey),
                const SizedBox(width: 8),
                Text(
                  order.restaurant?.name ?? 'Restaurant',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Delivery Address
            if (order.deliveryAddress != null)
              Row(
                children: [
                  Icon(Icons.location_on, size: 16, color: AppTheme.textGrey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order.deliveryAddress!.fullAddress,
                      style: TextStyle(color: AppTheme.textGrey),
                    ),
                  ),
                ],
              ),
            const SizedBox(height: 12),

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
                  order.paymentMethod == 'cod' ? 'Collect Cash' : 'Paid',
                  style: TextStyle(
                    color: order.paymentMethod == 'cod'
                        ? Colors.orange
                        : Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),

            // Buttons
            const SizedBox(height: 12),
            if (showAcceptButton)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await provider.acceptOrder(order.id);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  child: const Text(
                    'ACCEPT ORDER',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),

            if (order.status == 'ready')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await provider.updateOrderStatus(order.id, 'picked_up');
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                  child: const Text(
                    'PICKED UP',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),

            if (order.status == 'picked_up' || order.status == 'on_the_way')
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    await provider.updateOrderStatus(order.id, 'delivered');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  child: const Text(
                    'MARK DELIVERED',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'ready':
        return Colors.orange;
      case 'picked_up':
      case 'on_the_way':
        return Colors.blue;
      case 'delivered':
        return Colors.green;
      default:
        return Colors.grey;
    }
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
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  title,
                  style: TextStyle(color: AppTheme.textGrey, fontSize: 12),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
