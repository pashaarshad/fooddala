const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Restaurant.deleteMany({});
        await MenuItem.deleteMany({});
        console.log('Cleared existing data');

        // ========== CREATE TEST USERS FOR ALL ROLES ==========
        console.log('\n📧 Creating test users...');

        // 1. Admin User
        let adminUser = await User.findOne({ email: 'admin@fooddala.com' });
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Super Admin',
                email: 'admin@fooddala.com',
                password: 'admin123',
                role: 'admin',
                isVerified: true,
            });
            console.log('✅ Created Admin: admin@fooddala.com / admin123');
        } else {
            console.log('⏭️  Admin already exists');
        }

        // 2. Restaurant Owner
        let restaurantUser = await User.findOne({ email: 'restaurant@fooddala.com' });
        if (!restaurantUser) {
            restaurantUser = await User.create({
                name: 'Restaurant Owner',
                email: 'restaurant@fooddala.com',
                password: 'restaurant123',
                role: 'restaurant',
                isVerified: true,
            });
            console.log('✅ Created Restaurant: restaurant@fooddala.com / restaurant123');
        } else {
            console.log('⏭️  Restaurant user already exists');
        }

        // 3. Delivery Driver
        let driverUser = await User.findOne({ email: 'driver@fooddala.com' });
        if (!driverUser) {
            driverUser = await User.create({
                name: 'Delivery Partner',
                email: 'driver@fooddala.com',
                password: 'driver123',
                role: 'driver',
                isVerified: true,
            });
            console.log('✅ Created Driver: driver@fooddala.com / driver123');
        } else {
            console.log('⏭️  Driver user already exists');
        }

        // 4. Customer
        let customerUser = await User.findOne({ email: 'customer@fooddala.com' });
        if (!customerUser) {
            customerUser = await User.create({
                name: 'Test Customer',
                email: 'customer@fooddala.com',
                password: 'customer123',
                role: 'customer',
                isVerified: true,
                addresses: [{
                    label: 'home',
                    street: '123 Test Street',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pincode: '560001',
                }]
            });
            console.log('✅ Created Customer: customer@fooddala.com / customer123');
        } else {
            console.log('⏭️  Customer user already exists');
        }

        console.log('\n📋 Test Credentials Summary:');
        console.log('┌─────────────┬───────────────────────────┬─────────────────┐');
        console.log('│ Role        │ Email                     │ Password        │');
        console.log('├─────────────┼───────────────────────────┼─────────────────┤');
        console.log('│ Admin       │ admin@fooddala.com        │ admin123        │');
        console.log('│ Restaurant  │ restaurant@fooddala.com   │ restaurant123   │');
        console.log('│ Driver      │ driver@fooddala.com       │ driver123       │');
        console.log('│ Customer    │ customer@fooddala.com     │ customer123     │');
        console.log('└─────────────┴───────────────────────────┴─────────────────┘');

        // Use restaurant user as owner for seeded restaurants
        let owner = restaurantUser;

        // Create restaurants
        const restaurants = await Restaurant.create([
            {
                owner: owner._id,
                name: 'Spice Garden',
                description: 'Authentic Indian cuisine with a modern twist',
                cuisine: ['Indian', 'North Indian'],
                address: { street: '123 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
                location: { type: 'Point', coordinates: [77.5946, 12.9716] },
                phone: '+91 9876543210',
                email: 'contact@spicegarden.com',
                rating: 4.5,
                totalReviews: 234,
                avgDeliveryTime: 30,
                deliveryFee: 40,
                minimumOrder: 150,
                isOpen: true,
                isActive: true,
                isApproved: true,
                featured: true,
            },
            {
                owner: owner._id,
                name: 'Dragon Palace',
                description: 'Best Chinese and Thai food in town',
                cuisine: ['Chinese', 'Thai'],
                address: { street: '456 Brigade Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560025' },
                location: { type: 'Point', coordinates: [77.6070, 12.9719] },
                phone: '+91 9876543211',
                email: 'info@dragonpalace.com',
                rating: 4.2,
                totalReviews: 567,
                avgDeliveryTime: 35,
                deliveryFee: 50,
                minimumOrder: 200,
                isOpen: true,
                isActive: true,
                isApproved: true,
                featured: true,
            },
            {
                owner: owner._id,
                name: 'Pizza Paradise',
                description: 'Delicious wood-fired pizzas and Italian favorites',
                cuisine: ['Italian', 'Pizza'],
                address: { street: '789 Koramangala', city: 'Bengaluru', state: 'Karnataka', pincode: '560034' },
                location: { type: 'Point', coordinates: [77.6245, 12.9352] },
                phone: '+91 9876543212',
                email: 'hello@pizzaparadise.com',
                rating: 4.7,
                totalReviews: 890,
                avgDeliveryTime: 40,
                deliveryFee: 60,
                minimumOrder: 250,
                isOpen: true,
                isActive: true,
                isApproved: true,
                featured: true,
            },
            {
                owner: owner._id,
                name: 'Taco Town',
                description: 'Authentic Mexican street food',
                cuisine: ['Mexican', 'Fast Food'],
                address: { street: '321 Indiranagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
                location: { type: 'Point', coordinates: [77.6410, 12.9784] },
                phone: '+91 9876543213',
                email: 'info@tacotown.com',
                rating: 4.0,
                totalReviews: 345,
                avgDeliveryTime: 25,
                deliveryFee: 35,
                minimumOrder: 100,
                isOpen: true,
                isActive: true,
                isApproved: true,
            },
            {
                owner: owner._id,
                name: 'Sushi Station',
                description: 'Fresh sushi and Japanese delicacies',
                cuisine: ['Japanese', 'Sushi'],
                address: { street: '555 HSR Layout', city: 'Bengaluru', state: 'Karnataka', pincode: '560102' },
                location: { type: 'Point', coordinates: [77.6500, 12.9121] },
                phone: '+91 9876543214',
                email: 'hello@sushistation.com',
                rating: 4.8,
                totalReviews: 456,
                avgDeliveryTime: 45,
                deliveryFee: 70,
                minimumOrder: 300,
                isOpen: true,
                isActive: true,
                isApproved: true,
                featured: true,
            },
            {
                owner: owner._id,
                name: 'Burger Barn',
                description: 'Juicy burgers, crispy fries, and creamy shakes',
                cuisine: ['American', 'Burgers'],
                address: { street: '888 Whitefield', city: 'Bengaluru', state: 'Karnataka', pincode: '560066' },
                location: { type: 'Point', coordinates: [77.7500, 12.9698] },
                phone: '+91 9876543215',
                email: 'eat@burgerbarn.com',
                rating: 4.3,
                totalReviews: 789,
                avgDeliveryTime: 30,
                deliveryFee: 45,
                minimumOrder: 150,
                isOpen: true,
                isActive: true,
                isApproved: true,
            },
        ]);

        console.log('Created ' + restaurants.length + ' restaurants');

        // Create menu items
        const menuItems = [];

        // Spice Garden menu
        menuItems.push(
            { restaurant: restaurants[0]._id, name: 'Paneer Tikka', description: 'Grilled cottage cheese with spices', price: 250, category: 'Starters', isVeg: true, isAvailable: true, spiceLevel: 'medium' },
            { restaurant: restaurants[0]._id, name: 'Chicken 65', description: 'Crispy fried chicken with aromatic spices', price: 280, category: 'Starters', isVeg: false, isAvailable: true, spiceLevel: 'hot' },
            { restaurant: restaurants[0]._id, name: 'Dal Makhani', description: 'Creamy black lentils cooked overnight', price: 220, category: 'Main Course', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[0]._id, name: 'Butter Chicken', description: 'Tender chicken in rich tomato gravy', price: 320, category: 'Main Course', isVeg: false, isAvailable: true, spiceLevel: 'medium' },
            { restaurant: restaurants[0]._id, name: 'Chicken Biryani', description: 'Fragrant rice with spices and chicken', price: 350, category: 'Main Course', isVeg: false, isAvailable: true, spiceLevel: 'medium' },
            { restaurant: restaurants[0]._id, name: 'Naan', description: 'Fresh baked bread from tandoor', price: 50, category: 'Breads', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[0]._id, name: 'Gulab Jamun', description: 'Sweet dumplings in sugar syrup', price: 120, category: 'Desserts', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        );

        // Dragon Palace menu
        menuItems.push(
            { restaurant: restaurants[1]._id, name: 'Veg Spring Roll', description: 'Crispy rolls with vegetable filling', price: 180, category: 'Starters', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[1]._id, name: 'Chicken Manchurian', description: 'Indo-Chinese chicken in spicy gravy', price: 280, category: 'Main Course', isVeg: false, isAvailable: true, spiceLevel: 'hot' },
            { restaurant: restaurants[1]._id, name: 'Veg Fried Rice', description: 'Wok-tossed rice with vegetables', price: 200, category: 'Main Course', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[1]._id, name: 'Hakka Noodles', description: 'Stir-fried noodles with vegetables', price: 220, category: 'Main Course', isVeg: true, isAvailable: true, spiceLevel: 'medium' },
        );

        // Pizza Paradise menu
        menuItems.push(
            { restaurant: restaurants[2]._id, name: 'Margherita Pizza', description: 'Classic tomato, mozzarella and basil', price: 350, category: 'Pizzas', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[2]._id, name: 'Pepperoni Pizza', description: 'Loaded with pepperoni and cheese', price: 450, category: 'Pizzas', isVeg: false, isAvailable: true, spiceLevel: 'medium' },
            { restaurant: restaurants[2]._id, name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 120, category: 'Sides', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[2]._id, name: 'Pasta Alfredo', description: 'Creamy white sauce pasta', price: 280, category: 'Pasta', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        );

        // Taco Town menu
        menuItems.push(
            { restaurant: restaurants[3]._id, name: 'Chicken Tacos', description: 'Soft tacos with seasoned chicken', price: 180, category: 'Tacos', isVeg: false, isAvailable: true, spiceLevel: 'medium' },
            { restaurant: restaurants[3]._id, name: 'Veg Burrito', description: 'Loaded burrito with beans and veggies', price: 220, category: 'Burritos', isVeg: true, isAvailable: true, spiceLevel: 'medium' },
            { restaurant: restaurants[3]._id, name: 'Nachos Grande', description: 'Chips with cheese, salsa and guac', price: 250, category: 'Sides', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        );

        // Sushi Station menu
        menuItems.push(
            { restaurant: restaurants[4]._id, name: 'California Roll', description: 'Crab, avocado and cucumber', price: 350, category: 'Sushi Rolls', isVeg: false, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[4]._id, name: 'Salmon Nigiri', description: 'Fresh salmon on rice', price: 280, category: 'Nigiri', isVeg: false, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[4]._id, name: 'Miso Soup', description: 'Traditional Japanese soup', price: 120, category: 'Soups', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        );

        // Burger Barn menu
        menuItems.push(
            { restaurant: restaurants[5]._id, name: 'Classic Burger', description: 'Beef patty with lettuce and cheese', price: 220, category: 'Burgers', isVeg: false, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[5]._id, name: 'Veg Burger', description: 'Crispy veg patty with fresh veggies', price: 180, category: 'Burgers', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
            { restaurant: restaurants[5]._id, name: 'French Fries', description: 'Crispy golden fries', price: 100, category: 'Sides', isVeg: true, isAvailable: true, spiceLevel: 'mild' },
        );

        await MenuItem.insertMany(menuItems);
        console.log('Created ' + menuItems.length + ' menu items');

        console.log('\nDatabase seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
};

seedData();
