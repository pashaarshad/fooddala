const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Driver = require('../models/Driver');
const { asyncHandler } = require('../middleware/errorHandler');

// ============== USER MANAGEMENT ==============

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getUsers = asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
        success: true,
        data: {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (admin)
exports.getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -refreshToken');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    res.json({
        success: true,
        data: { user },
    });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (admin)
exports.updateUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user: user.toPublicJSON() },
    });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (admin)
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found',
        });
    }

    user.role = role;
    await user.save();

    res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user: user.toPublicJSON() },
    });
});

// ============== RESTAURANT MANAGEMENT ==============

// @desc    Get all restaurants (admin)
// @route   GET /api/admin/restaurants
// @access  Private (admin)
exports.getRestaurants = asyncHandler(async (req, res) => {
    const { isApproved, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { 'address.city': { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(query)
        .populate('owner', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

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

// @desc    Approve/reject restaurant
// @route   PUT /api/admin/restaurants/:id/approve
// @access  Private (admin)
exports.approveRestaurant = asyncHandler(async (req, res) => {
    const { isApproved } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    restaurant.isApproved = isApproved;
    await restaurant.save();

    res.json({
        success: true,
        message: `Restaurant ${isApproved ? 'approved' : 'rejected'} successfully`,
        data: { restaurant },
    });
});

// @desc    Toggle restaurant featured status
// @route   PUT /api/admin/restaurants/:id/featured
// @access  Private (admin)
exports.toggleFeatured = asyncHandler(async (req, res) => {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    restaurant.featured = !restaurant.featured;
    await restaurant.save();

    res.json({
        success: true,
        message: `Restaurant ${restaurant.featured ? 'featured' : 'unfeatured'}`,
        data: { featured: restaurant.featured },
    });
});

// ============== DRIVER MANAGEMENT ==============

// @desc    Get all drivers
// @route   GET /api/admin/drivers
// @access  Private (admin)
exports.getDrivers = asyncHandler(async (req, res) => {
    const { isVerified, isOnline, page = 1, limit = 20 } = req.query;

    const query = {};
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';
    if (isOnline !== undefined) query.isOnline = isOnline === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const drivers = await Driver.find(query)
        .populate('user', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Driver.countDocuments(query);

    res.json({
        success: true,
        data: {
            drivers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
});

// @desc    Verify driver
// @route   PUT /api/admin/drivers/:id/verify
// @access  Private (admin)
exports.verifyDriver = asyncHandler(async (req, res) => {
    const { isVerified } = req.body;

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        return res.status(404).json({
            success: false,
            message: 'Driver not found',
        });
    }

    driver.isVerified = isVerified;
    await driver.save();

    // Update user role
    if (isVerified) {
        await User.findByIdAndUpdate(driver.user, { role: 'driver' });
    }

    res.json({
        success: true,
        message: `Driver ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: { driver },
    });
});

// ============== ORDER MANAGEMENT ==============

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private (admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
        .populate('customer', 'name email phone')
        .populate('restaurant', 'name')
        .populate('driver', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
        success: true,
        data: {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        },
    });
});

// ============== ANALYTICS ==============

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (admin)
exports.getAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Total counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalRestaurants = await Restaurant.countDocuments({ isApproved: true });
    const totalDrivers = await Driver.countDocuments({ isVerified: true });
    const totalOrders = await Order.countDocuments();

    // Orders by status
    const ordersByStatus = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue
    const revenueData = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: '$total' },
            },
        },
    ]);

    // Recent orders trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyOrders = await Order.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                orders: { $sum: 1 },
                revenue: { $sum: '$total' },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Top restaurants
    const topRestaurants = await Order.aggregate([
        { $match: { status: 'delivered' } },
        {
            $group: {
                _id: '$restaurant',
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$total' },
            },
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'restaurants',
                localField: '_id',
                foreignField: '_id',
                as: 'restaurant',
            },
        },
        { $unwind: '$restaurant' },
        {
            $project: {
                name: '$restaurant.name',
                logo: '$restaurant.logo',
                totalOrders: 1,
                totalRevenue: 1,
            },
        },
    ]);

    res.json({
        success: true,
        data: {
            overview: {
                totalUsers,
                totalRestaurants,
                totalDrivers,
                totalOrders,
                totalRevenue: revenueData[0]?.totalRevenue || 0,
                avgOrderValue: Math.round(revenueData[0]?.avgOrderValue || 0),
            },
            ordersByStatus: ordersByStatus.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            dailyOrders,
            topRestaurants,
        },
    });
});

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (admin)
exports.getDashboard = asyncHandler(async (req, res) => {
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const todayRevenue = await Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    const pendingRestaurants = await Restaurant.countDocuments({ isApproved: false });
    const pendingDrivers = await Driver.countDocuments({ isVerified: false });

    // Active orders
    const activeOrders = await Order.countDocuments({
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'] },
    });

    // Recent orders
    const recentOrders = await Order.find()
        .populate('customer', 'name')
        .populate('restaurant', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderNumber status total createdAt');

    res.json({
        success: true,
        data: {
            today: {
                orders: todayOrders,
                revenue: todayRevenue[0]?.total || 0,
            },
            pending: {
                restaurants: pendingRestaurants,
                drivers: pendingDrivers,
            },
            activeOrders,
            recentOrders,
        },
    });
});
