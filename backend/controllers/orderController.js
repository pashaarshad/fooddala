const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../services/emailService');
const paymentService = require('../services/paymentService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
    const {
        restaurantId,
        items,
        deliveryAddressId,
        deliveryAddress,
        paymentMethod,
        couponCode,
        specialInstructions,
    } = req.body;

    // Get restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    if (!restaurant.isOpen || !restaurant.isApproved) {
        return res.status(400).json({
            success: false,
            message: 'Restaurant is currently not accepting orders',
        });
    }

    // Get delivery address
    let address = deliveryAddress;
    if (deliveryAddressId) {
        const userAddress = req.user.addresses.id(deliveryAddressId);
        if (!userAddress) {
            return res.status(404).json({
                success: false,
                message: 'Delivery address not found',
            });
        }
        address = userAddress.toObject();
    }

    if (!address) {
        return res.status(400).json({
            success: false,
            message: 'Delivery address is required',
        });
    }

    // Process order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: `Menu item ${item.menuItemId} not found`,
            });
        }

        if (!menuItem.isAvailable) {
            return res.status(400).json({
                success: false,
                message: `${menuItem.name} is currently unavailable`,
            });
        }

        // Calculate item price with customizations
        let itemPrice = menuItem.discountPrice || menuItem.price;
        const customizations = [];

        if (item.customizations && item.customizations.length > 0) {
            for (const cust of item.customizations) {
                const menuCustomization = menuItem.customizations.find(c => c.name === cust.name);
                if (menuCustomization) {
                    const option = menuCustomization.options.find(o => o.name === cust.option);
                    if (option) {
                        itemPrice += option.price;
                        customizations.push({
                            name: cust.name,
                            option: cust.option,
                            price: option.price,
                        });
                    }
                }
            }
        }

        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
            menuItem: menuItem._id,
            name: menuItem.name,
            quantity: item.quantity,
            price: itemPrice,
            customizations,
            subtotal: itemSubtotal,
            specialInstructions: item.specialInstructions,
        });
    }

    // Check minimum order
    // if (subtotal < restaurant.minimumOrder) {
    //     return res.status(400).json({
    //         success: false,
    //         message: `Minimum order amount is ₹${restaurant.minimumOrder}`,
    //     });
    // }

    // Calculate totals (Testing mode - all fees = 0)
    const deliveryFee = 0;
    const packagingFee = 0;
    const tax = 0;
    let discount = 0;

    // TODO: Apply coupon code logic here

    const total = subtotal + tax + deliveryFee + packagingFee - discount;

    // Generate order number
    const orderNumber = Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
        orderNumber,
        customer: req.user._id,
        restaurant: restaurant._id,
        items: orderItems,
        subtotal,
        tax,
        deliveryFee,
        packagingFee,
        discount,
        total,
        couponCode,
        deliveryAddress: address,
        paymentMethod,
        specialInstructions,
        statusHistory: [{ status: 'pending', note: 'Order placed' }],
    });

    // Calculate estimated delivery time
    order.calculateEstimatedDelivery(restaurant.avgDeliveryTime, 30);
    await order.save();

    // If online payment, create Razorpay order
    let paymentData = null;
    if (paymentMethod === 'online') {
        const razorpayOrder = await paymentService.createOrder(total, 'INR', {
            orderId: order._id.toString(),
            orderNumber,
        });

        if (razorpayOrder.success) {
            order.paymentDetails = {
                razorpayOrderId: razorpayOrder.order.id,
            };
            await order.save();

            paymentData = {
                razorpayOrderId: razorpayOrder.order.id,
                razorpayKeyId: paymentService.getPublicKey(),
                amount: razorpayOrder.order.amount,
                currency: razorpayOrder.order.currency,
            };
        }
    }

    // Populate order for response
    await order.populate([
        { path: 'restaurant', select: 'name logo phone' },
        { path: 'customer', select: 'name email phone' },
    ]);

    res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: { order, payment: paymentData },
    });
});

// @desc    Verify payment and confirm order
// @route   POST /api/orders/:id/verify-payment
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res) => {
    const { razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    // Verify signature
    const isValid = paymentService.verifyPayment(
        order.paymentDetails.razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
    );

    if (!isValid) {
        order.paymentStatus = 'failed';
        order.addStatusHistory('cancelled', 'Payment verification failed');
        await order.save();

        return res.status(400).json({
            success: false,
            message: 'Payment verification failed',
        });
    }

    // Update order
    order.paymentDetails.razorpayPaymentId = razorpayPaymentId;
    order.paymentDetails.razorpaySignature = razorpaySignature;
    order.paymentStatus = 'paid';
    order.addStatusHistory('confirmed', 'Payment successful, order confirmed');
    await order.save();

    // Send confirmation email
    await sendOrderConfirmationEmail(
        req.user.email,
        req.user.name,
        order.orderNumber,
        order.items,
        order.total
    );

    await order.populate('restaurant', 'name logo phone');

    res.json({
        success: true,
        message: 'Payment successful, order confirmed',
        data: { order },
    });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: req.user._id };
    if (status) {
        query.status = { $in: status.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
        .populate('restaurant', 'name logo')
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('restaurant', 'name logo phone address')
        .populate('customer', 'name email phone')
        .populate('driver', 'name phone');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    // Check if user is authorized to view this order
    const isCustomer = order.customer._id.toString() === req.user._id.toString();
    const isRestaurant = await Restaurant.findOne({ owner: req.user._id, _id: order.restaurant._id });
    const isDriver = order.driver && order.driver._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isRestaurant && !isDriver && !isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to view this order',
        });
    }

    res.json({
        success: true,
        data: { order },
    });
});

// @desc    Update order status (restaurant/driver)
// @route   PUT /api/orders/:id/status
// @access  Private (restaurant/driver)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id)
        .populate('customer', 'name email')
        .populate('restaurant', 'name');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    // Idempotency: If status is already updated, return success
    if (order.status === status) {
        return res.json({
            success: true,
            data: order,
        });
    }

    // Validate status transition
    const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing', 'cancelled'],
        preparing: ['ready', 'cancelled'],
        ready: ['picked_up'],
        picked_up: ['on_the_way'],
        on_the_way: ['delivered'],
    };

    if (!validTransitions[order.status]?.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Cannot change status from ${order.status} to ${status}`,
        });
    }

    order.addStatusHistory(status, note);

    if (status === 'delivered') {
        order.actualDeliveryTime = new Date();
    }

    await order.save();

    // Send email notification
    const statusMessages = {
        confirmed: 'Your order has been confirmed by the restaurant!',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready for pickup',
        picked_up: 'Your order has been picked up by the delivery partner',
        on_the_way: 'Your order is on the way!',
        delivered: 'Your order has been delivered. Enjoy!',
        cancelled: 'Your order has been cancelled',
    };

    await sendOrderStatusEmail(
        order.customer.email,
        order.customer.name,
        order.orderNumber,
        status.replace('_', ' ').toUpperCase(),
        statusMessages[status]
    );

    res.json({
        success: true,
        message: 'Order status updated',
        data: { order },
    });
});

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    // Check if user can cancel
    if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to cancel this order',
        });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
            success: false,
            message: 'Order cannot be cancelled at this stage',
        });
    }

    order.addStatusHistory('cancelled', reason);
    order.cancellationReason = reason;

    // If payment was made, initiate refund
    if (order.paymentStatus === 'paid' && order.paymentDetails.razorpayPaymentId) {
        const refund = await paymentService.initiateRefund(order.paymentDetails.razorpayPaymentId);
        if (refund.success) {
            order.paymentStatus = 'refunded';
            order.refundAmount = order.total;
        }
    }

    await order.save();

    res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: { order },
    });
});

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant
// @access  Private (restaurant)
exports.getRestaurantOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    console.log(`Debug: User ${req.user._id} requesting orders`);

    // Find ALL restaurants owned by this user
    const restaurants = await Restaurant.find({ owner: req.user._id });

    if (!restaurants || restaurants.length === 0) {
        console.log('Debug: No restaurants found for user');
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found',
        });
    }

    // Get IDs of all owned restaurants
    const restaurantIds = restaurants.map(r => r._id);
    console.log(`Debug: Found ${restaurants.length} restaurants: ${restaurants.map(r => r.name).join(', ')}`);

    const query = { restaurant: { $in: restaurantIds } };
    if (status) {
        query.status = { $in: status.split(',') };
    }

    console.log('Debug: Order Query:', JSON.stringify(query));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
        .populate('customer', 'name phone')
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

// @desc    Get order tracking info
// @route   GET /api/orders/:id/track
// @access  Private
exports.trackOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('restaurant', 'name address location phone')
        .populate('driver', 'name phone')
        .select('orderNumber status statusHistory estimatedDeliveryTime deliveryAddress driverLocation');

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    res.json({
        success: true,
        data: { order },
    });
});

// @desc    Get driver's orders (history and active)
// @route   GET /api/orders/driver/orders
// @access  Private (driver)
exports.getDriverOrders = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { driver: req.user._id };
    if (status) {
        query.status = { $in: status.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
        .populate('restaurant', 'name address phone location')
        .populate('customer', 'name address phone')
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

// @desc    Get available orders for drivers
// @route   GET /api/orders/driver/available
// @access  Private (driver)
exports.getAvailableOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    // Find orders that are ready but have no driver assigned
    // Also ensuring they are near the driver location could be added here later
    const query = {
        status: 'ready',
        driver: { $exists: false } // or driver: null
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
        .populate('restaurant', 'name address phone location')
        .populate('customer', 'name address phone')
        .sort({ updatedAt: -1 }) // Newly ready first
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

// @desc    Assign driver to order
// @route   POST /api/orders/:id/accept
// @access  Private (driver)
exports.assignDriver = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found',
        });
    }

    if (order.driver) {
        return res.status(400).json({
            success: false,
            message: 'Order already has a driver',
        });
    }

    if (order.status !== 'ready') {
        return res.status(400).json({
            success: false,
            message: 'Order is not ready for pickup',
        });
    }

    order.driver = req.user._id;
    // We don't change status to 'picked_up' yet, driver does that when they arrive
    // But we might want to notify restaurant that driver is assigned

    await order.save();

    res.json({
        success: true,
        message: 'Order accepted successfully',
        data: { order },
    });
});

// @desc    Get restaurant stats
// @route   GET /api/orders/restaurant/stats
// @access  Private (Restaurant)
exports.getRestaurantStats = asyncHandler(async (req, res) => {
    const restaurants = await Restaurant.find({ owner: req.user._id });

    if (!restaurants || restaurants.length === 0) {
        return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const restaurantIds = restaurants.map(r => r._id);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's orders
    const todayOrders = await Order.find({
        restaurant: { $in: restaurantIds },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
    });

    const todayRevenue = todayOrders.reduce((acc, order) => acc + (order.total || 0), 0);

    // Get active orders count
    const activeOrdersCount = await Order.countDocuments({
        restaurant: { $in: restaurantIds },
        status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    });

    // Get total orders count
    const totalOrdersCount = await Order.countDocuments({
        restaurant: { $in: restaurantIds }
    });

    res.json({
        success: true,
        data: {
            todayRevenue,
            todayOrders: todayOrders.length,
            activeOrders: activeOrdersCount,
            totalOrders: totalOrdersCount
        }
    });
});
