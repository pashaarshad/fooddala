class Restaurant {
  final String id;
  final String name;
  final String description;
  final String address;
  final List<String> cuisine;
  final double rating;
  final int deliveryTime;
  final int deliveryFee;
  final String? image;
  final bool isOpen;

  Restaurant({
    required this.id,
    required this.name,
    required this.description,
    required this.address,
    required this.cuisine,
    required this.rating,
    required this.deliveryTime,
    required this.deliveryFee,
    this.image,
    required this.isOpen,
  });

  factory Restaurant.fromJson(Map<String, dynamic> json) {
    return Restaurant(
      id: json['_id'],
      name: json['name'],
      description: json['description'] ?? '',
      address: json['address'] is Map
          ? json['address']['street'] ?? ''
          : json['address'] ?? '',
      cuisine:
          (json['cuisine'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      rating: (json['rating'] ?? 0).toDouble(),
      deliveryTime: json['avgDeliveryTime'] ?? 30,
      deliveryFee: json['deliveryFee'] ?? 0,
      image: json['image'],
      isOpen: json['isOpen'] ?? true,
    );
  }
}
