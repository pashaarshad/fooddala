import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../providers/cart_provider.dart';
import '../providers/order_provider.dart';
import '../utils/theme.dart';
import 'order_success_screen.dart';
import 'payment_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  String _paymentMethod = 'cod';
  String _addressLabel = 'home';
  bool _isLoading = false;
  bool _isLoadingLocation = false;

  // Address fields
  final _streetController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _phoneController = TextEditingController(text: '9876543210');

  @override
  void dispose() {
    _streetController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  // Reverse geocode using OpenStreetMap Nominatim (works on web)
  Future<void> _reverseGeocode(double lat, double lng) async {
    try {
      final response = await http.get(
        Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&addressdetails=1',
        ),
        headers: {'User-Agent': 'Fooddala App'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data != null && data['address'] != null) {
          final addr = data['address'];

          // Build street from available components
          String street = '';
          if (addr['road'] != null) street = addr['road'];
          if (addr['neighbourhood'] != null) {
            street =
                addr['neighbourhood'] + (street.isNotEmpty ? ', $street' : '');
          }
          if (addr['suburb'] != null) {
            street = addr['suburb'] + (street.isNotEmpty ? ', $street' : '');
          }

          // If still no street, use display name
          if (street.isEmpty && data['display_name'] != null) {
            final parts = data['display_name'].toString().split(',');
            street = parts.take(2).join(', ').trim();
          }

          setState(() {
            _streetController.text = street;
            _cityController.text =
                addr['city'] ??
                addr['town'] ??
                addr['village'] ??
                addr['county'] ??
                '';
            _stateController.text = addr['state'] ?? '';
            _pincodeController.text = addr['postcode'] ?? '';
          });
        }
      }
    } catch (e) {
      print('Geocoding error: $e');
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);

    try {
      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Location permission denied');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Location permissions permanently denied');
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // Use Nominatim API for reverse geocoding (works on web)
      await _reverseGeocode(position.latitude, position.longitude);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location detected!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Could not get location: ${e.toString().replaceAll('Exception:', '')}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoadingLocation = false);
    }
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final cart = Provider.of<CartProvider>(context, listen: false);
      final orderProvider = Provider.of<OrderProvider>(context, listen: false);

      final restaurantId = cart.items.values.firstOrNull?.restaurantId ?? '';

      final items = cart.items.entries.map((entry) {
        return {'menuItemId': entry.key, 'quantity': entry.value.quantity};
      }).toList();

      final deliveryAddress = {
        'label': _addressLabel,
        'street': _streetController.text,
        'city': _cityController.text,
        'state': _stateController.text,
        'pincode': _pincodeController.text,
        'phone': _phoneController.text,
      };

      final order = await orderProvider.createOrder(
        restaurantId: restaurantId,
        items: items,
        deliveryAddress: deliveryAddress,
        paymentMethod: _paymentMethod,
      );

      if (order != null && mounted) {
        final orderNumber = order.orderNumber;
        final total = order.total;

        cart.clear();

        if (_paymentMethod == 'online') {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (ctx) =>
                  PaymentScreen(orderNumber: orderNumber, total: total),
            ),
          );
        } else {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (ctx) =>
                  OrderSuccessScreen(orderNumber: orderNumber, total: total),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to place order: ${e.toString().replaceAll('Exception:', '')}',
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: AppTheme.cardDark,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Delivery Address Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Delivery Address',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  // GPS Button
                  TextButton.icon(
                    onPressed: _isLoadingLocation ? null : _getCurrentLocation,
                    icon: _isLoadingLocation
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(Icons.my_location, color: AppTheme.primaryColor),
                    label: Text(
                      'Use GPS',
                      style: TextStyle(color: AppTheme.primaryColor),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Address Label Selection
              Row(
                children: [
                  _buildLabelChip('home', Icons.home, 'Home'),
                  const SizedBox(width: 8),
                  _buildLabelChip('work', Icons.work, 'Work'),
                  const SizedBox(width: 8),
                  _buildLabelChip('other', Icons.location_on, 'Other'),
                ],
              ),
              const SizedBox(height: 12),

              Card(
                color: AppTheme.cardDark,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _streetController,
                        decoration: const InputDecoration(
                          labelText: 'Street Address',
                          hintText: 'Enter your street address',
                          prefixIcon: Icon(Icons.location_on),
                        ),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _cityController,
                              decoration: const InputDecoration(
                                labelText: 'City',
                              ),
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _stateController,
                              decoration: const InputDecoration(
                                labelText: 'State',
                              ),
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _pincodeController,
                              decoration: const InputDecoration(
                                labelText: 'Pincode',
                              ),
                              keyboardType: TextInputType.number,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _phoneController,
                              decoration: const InputDecoration(
                                labelText: 'Phone',
                              ),
                              keyboardType: TextInputType.phone,
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Payment Method Section
              const Text(
                'Payment Method',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Card(
                color: AppTheme.cardDark,
                child: Column(
                  children: [
                    RadioListTile<String>(
                      value: 'cod',
                      groupValue: _paymentMethod,
                      onChanged: (v) => setState(() => _paymentMethod = v!),
                      title: const Text('Cash on Delivery'),
                      subtitle: const Text('Pay when you receive'),
                      secondary: const Icon(Icons.money, color: Colors.green),
                      activeColor: AppTheme.primaryColor,
                    ),
                    const Divider(height: 1),
                    RadioListTile<String>(
                      value: 'online',
                      groupValue: _paymentMethod,
                      onChanged: (v) => setState(() => _paymentMethod = v!),
                      title: const Text('Online Payment'),
                      subtitle: const Text('UPI, Cards, Net Banking'),
                      secondary: const Icon(
                        Icons.credit_card,
                        color: Colors.blue,
                      ),
                      activeColor: AppTheme.primaryColor,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Order Summary
              const Text(
                'Order Summary',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Card(
                color: AppTheme.cardDark,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      ...cart.items.values.map(
                        (item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text('${item.name} x${item.quantity}'),
                              ),
                              Text(
                                '₹${(item.price * item.quantity).toStringAsFixed(0)}',
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Divider(),
                      _buildSummaryRow(
                        'Item Total',
                        '₹${cart.totalAmount.toStringAsFixed(0)}',
                      ),
                      _buildSummaryRow('Delivery Fee', '₹40'),
                      _buildSummaryRow(
                        'Taxes (5%)',
                        '₹${(cart.totalAmount * 0.05).toStringAsFixed(0)}',
                      ),
                      const Divider(),
                      _buildSummaryRow(
                        'To Pay',
                        '₹${(cart.totalAmount + 40 + cart.totalAmount * 0.05).toStringAsFixed(0)}',
                        isBold: true,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardDark,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: ElevatedButton(
            onPressed: _isLoading ? null : _placeOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    'PLACE ORDER • ₹${(cart.totalAmount + 40 + cart.totalAmount * 0.05).toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabelChip(String value, IconData icon, String label) {
    final isSelected = _addressLabel == value;
    return GestureDetector(
      onTap: () => setState(() => _addressLabel = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : AppTheme.cardDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : Colors.grey,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? Colors.white : Colors.grey,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
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
              fontSize: isBold ? 18 : 14,
            ),
          ),
        ],
      ),
    );
  }
}
