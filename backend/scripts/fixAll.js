require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');

async function fixAll() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // 1. Get the restaurant owner
        const owner = await User.findOne({ role: 'restaurant' });
        if (!owner) {
            console.log('No restaurant owner found!');
            process.exit(1);
        }
        console.log(`Restaurant Owner: ${owner.email} (${owner._id})\n`);

        // 2. Update ALL restaurants to have this owner
        const restaurants = await Restaurant.find();
        console.log('Updating restaurants with owner...');
        for (const r of restaurants) {
            r.owner = owner._id;
            await r.save();
            console.log(`  Updated: ${r.name}`);
        }

        // 3. Get orders with null/invalid restaurant references
        const orders = await Order.find();
        const validRestaurantIds = restaurants.map(r => r._id.toString());

        // 4. If orders have invalid restaurant IDs, assign to first restaurant
        const firstRestaurant = restaurants[0];
        let fixed = 0;

        console.log('\nChecking orders for invalid restaurant references...');
        for (const order of orders) {
            const restaurantId = order.restaurant?.toString();
            if (!restaurantId || !validRestaurantIds.includes(restaurantId)) {
                order.restaurant = firstRestaurant._id;
                await order.save();
                console.log(`  Fixed order #${order.orderNumber} -> ${firstRestaurant.name}`);
                fixed++;
            }
        }

        console.log(`\nFixed ${fixed} orders with invalid restaurant references.`);

        // 5. Final check
        const ordersForOwner = await Order.find({
            restaurant: { $in: restaurants.map(r => r._id) }
        });
        console.log(`\nTotal orders for restaurant owner: ${ordersForOwner.length}`);

        console.log('\nDone! Restart the Flutter app and login as restaurant owner.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAll();
