require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

async function linkRestaurantToOwner() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find restaurant owner users
        const restaurantOwners = await User.find({ role: 'restaurant' });
        console.log(`Found ${restaurantOwners.length} restaurant owner(s):`);
        restaurantOwners.forEach(u => console.log(`  - ${u.email} (${u._id})`));

        if (restaurantOwners.length === 0) {
            console.log('\nNo restaurant owners found. Please create one first.');
            process.exit(0);
        }

        // Find restaurants without owners or with missing owners
        const restaurants = await Restaurant.find();
        console.log(`\nFound ${restaurants.length} restaurant(s):`);
        restaurants.forEach(r => console.log(`  - ${r.name} (owner: ${r.owner || 'NONE'})`));

        // Link first restaurant owner to restaurants that don't have owners
        const firstOwner = restaurantOwners[0];
        let updated = 0;

        for (const restaurant of restaurants) {
            if (!restaurant.owner) {
                restaurant.owner = firstOwner._id;
                await restaurant.save();
                console.log(`\nLinked "${restaurant.name}" to "${firstOwner.email}"`);
                updated++;
            }
        }

        if (updated === 0) {
            // If all restaurants have owners, link first restaurant to first owner anyway
            const firstRestaurant = restaurants[0];
            if (firstRestaurant) {
                firstRestaurant.owner = firstOwner._id;
                await firstRestaurant.save();
                console.log(`\nUpdated: "${firstRestaurant.name}" now belongs to "${firstOwner.email}"`);
            }
        }

        console.log('\nDone! Restaurant owners can now see orders.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

linkRestaurantToOwner();
