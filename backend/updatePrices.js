const mongoose = require('mongoose');
require('dotenv').config();
const MenuItem = require('./models/MenuItem');

async function updatePrices() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await MenuItem.updateMany({}, {
            $set: { price: 1, discountPrice: null }
        });

        console.log('✅ Updated', result.modifiedCount, 'menu items to ₹1');

        await mongoose.disconnect();
        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updatePrices();
