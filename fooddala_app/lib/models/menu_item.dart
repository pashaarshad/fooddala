class MenuItem {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String? image;
  final bool isVeg;
  final bool isAvailable;

  MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    this.image,
    required this.isVeg,
    required this.isAvailable,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: (json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      price: double.tryParse((json['price'] ?? 0).toString()) ?? 0.0,
      category: (json['category'] ?? 'General').toString(),
      image: json['image']?.toString(),
      isVeg: json['isVeg'] == true,
      isAvailable: json['isAvailable'] != false,
    );
  }
}
