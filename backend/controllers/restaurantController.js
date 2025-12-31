const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all restaurants (with search, filters, pagination)
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = asyncHandler(async (req, res) => {
    const {
        search,
        cuisine,
        rating,
        priceRange,
        isOpen,
        sortBy = 'rating',
        page = 1,
        limit = 20,
        lat,
        lng,
        radius = 10, // km
    } = req.query;

    const query = { isApproved: true, isActive: true };

    // Search by name or cuisine
    if (search) {
        query.$text = { $search: search };
    }

    // Filter by cuisine
    if (cuisine) {
        query.cuisine = { $in: cuisine.split(',') };
    }

    // Filter by minimum rating
    if (rating) {
        query.rating = { $gte: parseFloat(rating) };
    }

    // Filter by open status
    if (isOpen === 'true') {
        query.isOpen = true;
    }

    // Geospatial query for nearby restaurants
    if (lat && lng) {
        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)],
                },
                $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
            },
        };
    }

    // Sorting
    let sort = {};
    switch (sortBy) {
        case 'rating':
            sort = { rating: -1 };
            break;
        case 'deliveryTime':
            sort = { avgDeliveryTime: 1 };
            break;
        case 'deliveryFee':
            sort = { deliveryFee: 1 };
            break;
        case 'newest':
            sort = { createdAt: -1 };
            break;
        default:
            sort = { rating: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-openingHours');

    const total = await Restaurant.countDocuments(query);

    res.json({
        success: true,
        data: {
            restaurants,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
});

// @desc    Get featured restaurants
// @route   GET /api/restaurants/featured
// @access  Public
exports.getFeaturedRestaurants = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find({
        isApproved: true,
        isActive: true,
        featured: true,
    })
        .sort({ rating: -1 })
        .limit(10)
        .select('name logo images cuisine rating totalReviews avgDeliveryTime deliveryFee');

    res.json({
        success: true,
        data: { restaurants },
    });
});

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email');

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    res.json({
        success: true,
        data: { restaurant },
    });
});

// @desc    Get restaurant menu
// @route   GET /api/restaurants/:id/menu
// @access  Public
exports.getRestaurantMenu = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { category } = req.query;

    const query = { restaurant: id };
    if (category) {
        query.category = category;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, sortOrder: 1 });

    // Group by category
    const menuByCategory = menuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    res.json({
        success: true,
        data: { menu: menuByCategory, items: menuItems },
    });
});

// @desc    Create restaurant (for restaurant owners)
// @route   POST /api/restaurants
// @access  Private (restaurant role)
exports.createRestaurant = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        cuisine,
        address,
        location,
        phone,
        email,
        openingHours,
        deliveryRadius,
        minimumOrder,
        deliveryFee,
        avgDeliveryTime,
        tags,
    } = req.body;

    // Check if user already has a restaurant
    const existingRestaurant = await Restaurant.findOne({ owner: req.user._id });
    if (existingRestaurant) {
        return res.status(400).json({
            success: false,
            message: 'You already have a restaurant registered',
        });
    }

    const restaurant = await Restaurant.create({
        owner: req.user._id,
        name,
        description,
        cuisine,
        address,
        location: location || { type: 'Point', coordinates: [0, 0] },
        phone,
        email,
        openingHours,
        deliveryRadius,
        minimumOrder,
        deliveryFee,
        avgDeliveryTime,
        tags,
    });

    // Update user role to restaurant owner
    req.user.role = 'restaurant';
    await req.user.save();

    res.status(201).json({
        success: true,
        message: 'Restaurant created successfully. Pending admin approval.',
        data: { restaurant },
    });
});

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private (restaurant owner)
exports.updateRestaurant = asyncHandler(async (req, res) => {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this restaurant',
        });
    }

    const allowedUpdates = [
        'name', 'description', 'cuisine', 'address', 'location', 'phone', 'email',
        'openingHours', 'deliveryRadius', 'minimumOrder', 'deliveryFee', 'avgDeliveryTime', 'tags',
    ];

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            restaurant[field] = req.body[field];
        }
    });

    await restaurant.save();

    res.json({
        success: true,
        message: 'Restaurant updated successfully',
        data: { restaurant },
    });
});

// @desc    Update restaurant images
// @route   PUT /api/restaurants/:id/images
// @access  Private (restaurant owner)
exports.updateRestaurantImages = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized',
        });
    }

    if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => file.path);
        restaurant.images = [...restaurant.images, ...newImages];
        await restaurant.save();
    }

    res.json({
        success: true,
        data: { images: restaurant.images },
    });
});

// @desc    Update restaurant logo
// @route   PUT /api/restaurants/:id/logo
// @access  Private (restaurant owner)
exports.updateRestaurantLogo = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized',
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload a logo',
        });
    }

    // Delete old logo
    if (restaurant.logo && restaurant.logo.includes('cloudinary')) {
        const publicId = getPublicIdFromUrl(restaurant.logo);
        if (publicId) await deleteImage(publicId);
    }

    restaurant.logo = req.file.path;
    await restaurant.save();

    res.json({
        success: true,
        data: { logo: restaurant.logo },
    });
});

// @desc    Toggle restaurant open/closed
// @route   PUT /api/restaurants/:id/status
// @access  Private (restaurant owner)
exports.toggleRestaurantStatus = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized',
        });
    }

    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();

    res.json({
        success: true,
        message: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`,
        data: { isOpen: restaurant.isOpen },
    });
});

// @desc    Get my restaurant (for restaurant owners)
// @route   GET /api/restaurants/my-restaurant
// @access  Private (restaurant role)
exports.getMyRestaurant = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'You do not have a restaurant registered',
        });
    }

    res.json({
        success: true,
        data: { restaurant },
    });
});

// @desc    Get cuisines list
// @route   GET /api/restaurants/cuisines
// @access  Public
exports.getCuisines = asyncHandler(async (req, res) => {
    const cuisines = await Restaurant.distinct('cuisine', { isApproved: true, isActive: true });

    res.json({
        success: true,
        data: { cuisines: cuisines.filter(Boolean).sort() },
    });
});
