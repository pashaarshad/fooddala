require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

// Sample food images from Unsplash (free to use)
const foodImages = {
    // Italian
    'Pasta': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400',
    'Pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
    'Lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400',
    'Risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400',

    // Japanese
    'Sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    'Ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    'Tempura': 'https://images.unsplash.com/photo-1581781870027-04212e231e96?w=400',
    'Miso': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',

    // Indian
    'Curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    'Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    'Naan': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    'Tandoori': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
    'Paneer': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',

    // American
    'Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    'Steak': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    'Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    'Wings': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',

    // Chinese
    'Noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    'Dumplings': 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400',
    'Rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',

    // Desserts
    'Cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    'Ice Cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400',
    'Brownie': 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400',

    // Drinks
    'Coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    'Tea': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    'Juice': 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    'Smoothie': 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',

    // Default
    'default': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
};

function getImageForItem(itemName) {
    const nameLower = itemName.toLowerCase();

    for (const [key, url] of Object.entries(foodImages)) {
        if (nameLower.includes(key.toLowerCase())) {
            return url;
        }
    }

    return foodImages['default'];
}

async function addImagesToMenuItems() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const menuItems = await MenuItem.find({});
        console.log(`Found ${menuItems.length} menu items`);

        for (const item of menuItems) {
            if (!item.image || item.image === '') {
                item.image = getImageForItem(item.name);
                await item.save();
                console.log(`Updated ${item.name} with image`);
            }
        }

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addImagesToMenuItems();
