import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/order_provider.dart';
import '../models/order.dart';
import '../utils/theme.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String orderId;

  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => Provider.of<OrderProvider>(
        context,
        listen: false,
      ).fetchOrderById(widget.orderId),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Track Order'),
        backgroundColor: AppTheme.cardDark,
      ),
      body: Consumer<OrderProvider>(
        builder: (ctx, orderData, _) {
          if (orderData.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final order = orderData.currentOrder;
          if (order == null) {
            return const Center(child: Text('Order not found'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Order Header
                Card(
                  color: AppTheme.cardDark,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order.orderNumber,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            _buildStatusBadge(
                              order.status,
                              order.statusDisplay,
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        if (order.restaurant != null)
                          Text(
                            order.restaurant!.name,
                            style: TextStyle(color: AppTheme.textGrey),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Progress Tracker
                const Text(
                  'Order Status',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                _buildProgressTracker(order.status),
                const SizedBox(height: 24),

                // Driver Info (if assigned)
                if (order.driver != null) ...[
                  const Text(
                    'Delivery Partner',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    color: AppTheme.cardDark,
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primaryColor,
                        child: Text(
                          order.driver!.name[0].toUpperCase(),
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                      title: Text(order.driver!.name),
                      subtitle: Text(order.driver!.phone ?? 'Arriving soon'),
                      trailing: IconButton(
                        icon: const Icon(Icons.phone, color: Colors.green),
                        onPressed: () {},
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Delivery Address
                if (order.deliveryAddress != null) ...[
                  const Text(
                    'Delivery Address',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    color: AppTheme.cardDark,
                    child: ListTile(
                      leading: const Icon(
                        Icons.location_on,
                        color: AppTheme.primaryColor,
                      ),
                      title: Text(order.deliveryAddress!.street),
                      subtitle: Text(
                        '${order.deliveryAddress!.city}, ${order.deliveryAddress!.state} - ${order.deliveryAddress!.pincode}',
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Order Items
                const Text(
                  'Order Items',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Card(
                  color: AppTheme.cardDark,
                  child: Column(
                    children: order.items.map((item) {
                      return ListTile(
                        title: Text(item.name),
                        subtitle: Text(
                          '₹${item.price.toStringAsFixed(0)} x ${item.quantity}',
                        ),
                        trailing: Text(
                          '₹${(item.price * item.quantity).toStringAsFixed(0)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 16),

                // Bill Summary
                Card(
                  color: AppTheme.cardDark,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        _buildBillRow(
                          'Item Total',
                          '₹${(order.total - order.deliveryFee).toStringAsFixed(0)}',
                        ),
                        _buildBillRow(
                          'Delivery Fee',
                          '₹${order.deliveryFee.toStringAsFixed(0)}',
                        ),
                        const Divider(),
                        _buildBillRow(
                          'Total',
                          '₹${order.total.toStringAsFixed(0)}',
                          isBold: true,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusBadge(String status, String display) {
    Color color;
    switch (status) {
      case 'delivered':
        color = Colors.green;
        break;
      case 'cancelled':
        color = Colors.red;
        break;
      case 'preparing':
      case 'ready':
        color = Colors.orange;
        break;
      default:
        color = AppTheme.primaryColor;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        display,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildProgressTracker(String currentStatus) {
    final stages = [
      {'key': 'pending', 'label': 'Placed', 'icon': Icons.receipt},
      {'key': 'confirmed', 'label': 'Confirmed', 'icon': Icons.check_circle},
      {'key': 'preparing', 'label': 'Preparing', 'icon': Icons.restaurant},
      {'key': 'ready', 'label': 'Ready', 'icon': Icons.takeout_dining},
      {'key': 'picked_up', 'label': 'Picked Up', 'icon': Icons.delivery_dining},
      {'key': 'delivered', 'label': 'Delivered', 'icon': Icons.home},
    ];

    final statusOrder = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'picked_up',
      'on_the_way',
      'delivered',
    ];
    final currentIndex = statusOrder.indexOf(currentStatus);

    return Column(
      children: stages.asMap().entries.map((entry) {
        final index = entry.key;
        final stage = entry.value;
        final stageIndex = statusOrder.indexOf(stage['key'] as String);
        final isCompleted = stageIndex <= currentIndex;
        final isCurrent = stage['key'] == currentStatus;

        return Row(
          children: [
            Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: isCompleted
                        ? AppTheme.primaryColor
                        : AppTheme.cardDark,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isCompleted ? AppTheme.primaryColor : Colors.grey,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    stage['icon'] as IconData,
                    color: isCompleted ? Colors.white : Colors.grey,
                    size: 20,
                  ),
                ),
                if (index < stages.length - 1)
                  Container(
                    width: 2,
                    height: 30,
                    color: isCompleted ? AppTheme.primaryColor : Colors.grey,
                  ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  stage['label'] as String,
                  style: TextStyle(
                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                    color: isCompleted ? Colors.white : Colors.grey,
                  ),
                ),
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  Widget _buildBillRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(color: isBold ? Colors.white : AppTheme.textGrey),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: isBold ? AppTheme.primaryColor : Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
