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
      id: json['_id'],
      name: json['name'],
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      category: json['category'] ?? 'General',
      image: json['image'],
      isVeg: json['isVeg'] ?? true,
      isAvailable: json['isAvailable'] ?? true,
    );
  }
}
