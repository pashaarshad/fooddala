const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    updateUserStatus,
    updateUserRole,
    getRestaurants,
    approveRestaurant,
    toggleFeatured,
    getDrivers,
    verifyDriver,
    getAllOrders,
    getAnalytics,
    getDashboard,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

// User management
router.get('/users', validations.pagination, validate, getUsers);
router.get('/users/:id', validations.mongoId, validate, getUser);
router.put('/users/:id/status', validations.mongoId, validate, updateUserStatus);
router.put('/users/:id/role', validations.mongoId, validate, updateUserRole);

// Restaurant management
router.get('/restaurants', validations.pagination, validate, getRestaurants);
router.put('/restaurants/:id/approve', validations.mongoId, validate, approveRestaurant);
router.put('/restaurants/:id/featured', validations.mongoId, validate, toggleFeatured);

// Driver management
router.get('/drivers', validations.pagination, validate, getDrivers);
router.put('/drivers/:id/verify', validations.mongoId, validate, verifyDriver);

// Order management
router.get('/orders', validations.pagination, validate, getAllOrders);

module.exports = router;
