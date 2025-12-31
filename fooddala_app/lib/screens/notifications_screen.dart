import 'package:flutter/material.dart';
import '../utils/theme.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Demo notifications
    final notifications = [
      {
        'icon': Icons.local_offer,
        'color': Colors.orange,
        'title': '50% OFF on your next order!',
        'subtitle': 'Use code FOOD50 to get 50% off on orders above ₹299',
        'time': '2 hours ago',
        'isRead': false,
      },
      {
        'icon': Icons.delivery_dining,
        'color': Colors.green,
        'title': 'Order Delivered!',
        'subtitle': 'Your order #FD1234 has been delivered successfully',
        'time': '1 day ago',
        'isRead': true,
      },
      {
        'icon': Icons.restaurant,
        'color': Colors.blue,
        'title': 'New restaurant near you!',
        'subtitle': 'Spice Garden is now available for delivery in your area',
        'time': '2 days ago',
        'isRead': true,
      },
      {
        'icon': Icons.star,
        'color': Colors.amber,
        'title': 'Rate your order',
        'subtitle': 'How was your order from Pizza Palace? Leave a review!',
        'time': '3 days ago',
        'isRead': true,
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppTheme.cardDark,
        actions: [
          TextButton(onPressed: () {}, child: const Text('Mark all read')),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🔔', style: TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  const Text('No notifications'),
                  Text(
                    'You\'re all caught up!',
                    style: TextStyle(color: AppTheme.textGrey),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              itemBuilder: (ctx, i) {
                final notif = notifications[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  color: notif['isRead'] as bool
                      ? AppTheme.cardDark
                      : AppTheme.primaryColor.withOpacity(0.1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: notif['isRead'] as bool
                          ? Colors.white.withOpacity(0.05)
                          : AppTheme.primaryColor.withOpacity(0.3),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: (notif['color'] as Color).withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            notif['icon'] as IconData,
                            color: notif['color'] as Color,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      notif['title'] as String,
                                      style: TextStyle(
                                        fontWeight: notif['isRead'] as bool
                                            ? FontWeight.normal
                                            : FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (!(notif['isRead'] as bool))
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppTheme.primaryColor,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notif['subtitle'] as String,
                                style: TextStyle(
                                  color: AppTheme.textGrey,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                notif['time'] as String,
                                style: TextStyle(
                                  color: AppTheme.textGrey,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
