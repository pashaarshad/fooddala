const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get all menu items for a restaurant
// @route   GET /api/menu/restaurant/:restaurantId
// @access  Public
exports.getMenuItems = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;
    const { category, available } = req.query;

    const query = { restaurant: restaurantId };

    if (category) {
        query.category = category;
    }

    if (available === 'true') {
        query.isAvailable = true;
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, sortOrder: 1, name: 1 });

    res.json({
        success: true,
        data: { menuItems },
    });
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
exports.getMenuItem = asyncHandler(async (req, res) => {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant', 'name');

    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found',
        });
    }

    res.json({
        success: true,
        data: { menuItem },
    });
});

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (restaurant owner)
exports.createMenuItem = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        discountPrice,
        category,
        isVeg,
        isVegan,
        isGlutenFree,
        spiceLevel,
        customizations,
        preparationTime,
        calories,
        tags,
        sortOrder,
    } = req.body;

    // Get restaurant owned by user
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'You do not have a restaurant',
        });
    }

    const menuItem = await MenuItem.create({
        restaurant: restaurant._id,
        name,
        description,
        price,
        discountPrice,
        category,
        isVeg,
        isVegan,
        isGlutenFree,
        spiceLevel,
        customizations,
        preparationTime,
        calories,
        tags,
        sortOrder,
        image: req.file ? req.file.path : '',
    });

    res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: { menuItem },
    });
});

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (restaurant owner)
exports.updateMenuItem = asyncHandler(async (req, res) => {
    let menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found',
        });
    }

    // Check ownership
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to update this menu item',
        });
    }

    const allowedUpdates = [
        'name', 'description', 'price', 'discountPrice', 'category', 'isVeg',
        'isVegan', 'isGlutenFree', 'spiceLevel', 'isAvailable', 'isFeatured',
        'customizations', 'preparationTime', 'calories', 'tags', 'sortOrder',
    ];

    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
            menuItem[field] = req.body[field];
        }
    });

    await menuItem.save();

    res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: { menuItem },
    });
});

// @desc    Update menu item image
// @route   PUT /api/menu/:id/image
// @access  Private (restaurant owner)
exports.updateMenuItemImage = asyncHandler(async (req, res) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found',
        });
    }

    // Check ownership
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized',
        });
    }

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image',
        });
    }

    // Delete old image
    if (menuItem.image && menuItem.image.includes('cloudinary')) {
        const publicId = getPublicIdFromUrl(menuItem.image);
        if (publicId) await deleteImage(publicId);
    }

    menuItem.image = req.file.path;
    await menuItem.save();

    res.json({
        success: true,
        data: { image: menuItem.image },
    });
});

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (restaurant owner)
exports.deleteMenuItem = asyncHandler(async (req, res) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found',
        });
    }

    // Check ownership
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to delete this menu item',
        });
    }

    // Delete image from Cloudinary
    if (menuItem.image && menuItem.image.includes('cloudinary')) {
        const publicId = getPublicIdFromUrl(menuItem.image);
        if (publicId) await deleteImage(publicId);
    }

    await menuItem.deleteOne();

    res.json({
        success: true,
        message: 'Menu item deleted successfully',
    });
});

// @desc    Toggle menu item availability
// @route   PUT /api/menu/:id/availability
// @access  Private (restaurant owner)
exports.toggleAvailability = asyncHandler(async (req, res) => {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found',
        });
    }

    // Check ownership
    const restaurant = await Restaurant.findById(menuItem.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized',
        });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.json({
        success: true,
        message: `Item is now ${menuItem.isAvailable ? 'available' : 'unavailable'}`,
        data: { isAvailable: menuItem.isAvailable },
    });
});

// @desc    Get menu categories for a restaurant
// @route   GET /api/menu/categories/:restaurantId
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
    const { restaurantId } = req.params;

    const categories = await MenuItem.distinct('category', { restaurant: restaurantId });

    res.json({
        success: true,
        data: { categories: categories.sort() },
    });
});

// @desc    Bulk update availability
// @route   PUT /api/menu/bulk-availability
// @access  Private (restaurant owner)
exports.bulkUpdateAvailability = asyncHandler(async (req, res) => {
    const { itemIds, isAvailable } = req.body;

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'You do not have a restaurant',
        });
    }

    await MenuItem.updateMany(
        { _id: { $in: itemIds }, restaurant: restaurant._id },
        { isAvailable }
    );

    res.json({
        success: true,
        message: `Updated ${itemIds.length} items`,
    });
});
