const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getMyOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder,
    getRestaurantOrders,
    trackOrder,
    getDriverOrders,
    getAvailableOrders,
    assignDriver,
    getRestaurantStats,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// =====================================================
// IMPORTANT: Static routes MUST come BEFORE /:id routes
// =====================================================

// Customer list route (no params)
router.post('/', validations.createOrder, validate, createOrder);
router.get('/', validations.pagination, validate, getMyOrders);

// Restaurant routes (static path - must be before /:id)
router.get(
    '/restaurant/orders',
    authorize('restaurant', 'admin'),
    validations.pagination,
    validate,
    getRestaurantOrders
);

router.get(
    '/restaurant/stats',
    authorize('restaurant', 'admin'),
    getRestaurantStats
);

// Driver routes (static path - must be before /:id)
router.get(
    '/driver/orders',
    authorize('driver', 'admin'),
    validations.pagination,
    validate,
    getDriverOrders
);
router.get(
    '/driver/available',
    authorize('driver', 'admin'),
    validations.pagination,
    validate,
    getAvailableOrders
);

// =====================================================
// Dynamic /:id routes AFTER static routes
// =====================================================

// Order-specific routes
router.get('/:id', validations.mongoId, validate, getOrder);
router.get('/:id/track', validations.mongoId, validate, trackOrder);
router.post('/:id/verify-payment', validations.mongoId, validate, verifyPayment);
router.post('/:id/cancel', validations.mongoId, validate, cancelOrder);

// Driver accept order
router.post(
    '/:id/accept',
    authorize('driver', 'admin'),
    validations.mongoId,
    validate,
    assignDriver
);

// Update order status (restaurant, driver, admin can update)
router.put(
    '/:id/status',
    authorize('restaurant', 'driver', 'admin'),
    validations.mongoId,
    validate,
    updateOrderStatus
);

module.exports = router;
