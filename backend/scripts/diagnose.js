require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');

async function diagnose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // 1. Check restaurant owners
        const owners = await User.find({ role: 'restaurant' });
        console.log('=== RESTAURANT OWNERS ===');
        for (const owner of owners) {
            console.log(`  ID: ${owner._id}`);
            console.log(`  Email: ${owner.email}`);
            console.log(`  Name: ${owner.name}`);
            console.log('');
        }

        // 2. Check restaurants and their owners
        const restaurants = await Restaurant.find();
        console.log('=== RESTAURANTS ===');
        for (const r of restaurants) {
            console.log(`  ID: ${r._id}`);
            console.log(`  Name: ${r.name}`);
            console.log(`  Owner: ${r.owner || 'NONE'}`);
            console.log('');
        }

        // 3. Check orders
        const orders = await Order.find().populate('restaurant', 'name owner');
        console.log('=== ORDERS ===');
        console.log(`Total orders: ${orders.length}`);
        for (const o of orders.slice(0, 5)) {
            console.log(`  Order #${o.orderNumber}`);
            console.log(`  Restaurant: ${o.restaurant?.name || 'NOT FOUND'} (ID: ${o.restaurant?._id || o.restaurant})`);
            console.log(`  Restaurant Owner: ${o.restaurant?.owner || 'NONE'}`);
            console.log(`  Status: ${o.status}`);
            console.log('');
        }

        // 4. Fix: Update restaurants to have correct owner
        if (owners.length > 0 && restaurants.length > 0) {
            console.log('=== FIXING OWNERSHIP ===');
            const ownerId = owners[0]._id;

            for (const restaurant of restaurants) {
                if (!restaurant.owner || restaurant.owner.toString() !== ownerId.toString()) {
                    restaurant.owner = ownerId;
                    await restaurant.save();
                    console.log(`Updated "${restaurant.name}" owner to ${owners[0].email}`);
                }
            }
        }

        // 5. Print summary
        console.log('\n=== SUMMARY ===');
        console.log(`Restaurant Owners: ${owners.length}`);
        console.log(`Restaurants: ${restaurants.length}`);
        console.log(`Orders: ${orders.length}`);

        // Check which restaurant the orders belong to
        const ordersByRestaurant = {};
        for (const o of orders) {
            const rId = o.restaurant?._id?.toString() || o.restaurant?.toString() || 'unknown';
            ordersByRestaurant[rId] = (ordersByRestaurant[rId] || 0) + 1;
        }
        console.log('\nOrders by Restaurant:');
        for (const [rId, count] of Object.entries(ordersByRestaurant)) {
            const r = restaurants.find(r => r._id.toString() === rId);
            console.log(`  ${r?.name || rId}: ${count} orders`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

diagnose();
