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
      id: (json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      address: json['address'] is Map
          ? (json['address']['street'] ?? '').toString()
          : (json['address'] ?? '').toString(),
      cuisine:
          (json['cuisine'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      rating: double.tryParse((json['rating'] ?? 0).toString()) ?? 0.0,
      deliveryTime:
          int.tryParse((json['avgDeliveryTime'] ?? 30).toString()) ?? 30,
      deliveryFee: int.tryParse((json['deliveryFee'] ?? 0).toString()) ?? 0,
      image: json['image']?.toString(),
      isOpen: json['isOpen'] == true,
    );
  }
}
