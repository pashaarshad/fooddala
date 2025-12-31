const express = require('express');
const router = express.Router();
const {
    getRestaurants,
    getFeaturedRestaurants,
    getRestaurant,
    getRestaurantMenu,
    createRestaurant,
    updateRestaurant,
    updateRestaurantImages,
    updateRestaurantLogo,
    toggleRestaurantStatus,
    getMyRestaurant,
    getCuisines,
} = require('../controllers/restaurantController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { uploadRestaurantImage } = require('../config/cloudinary');

// Public routes
router.get('/', optionalAuth, getRestaurants);
router.get('/featured', getFeaturedRestaurants);
router.get('/cuisines', getCuisines);
router.get('/:id', validations.mongoId, validate, getRestaurant);
router.get('/:id/menu', validations.mongoId, validate, getRestaurantMenu);

// Protected routes (authenticated users)
router.use(protect);

// Restaurant owner routes
router.get('/my-restaurant', authorize('restaurant', 'admin'), getMyRestaurant);
router.post('/', validations.createRestaurant, validate, createRestaurant);
router.put('/:id', validations.mongoId, validate, updateRestaurant);
router.put(
    '/:id/images',
    validations.mongoId,
    validate,
    uploadRestaurantImage.array('images', 10),
    updateRestaurantImages
);
router.put(
    '/:id/logo',
    validations.mongoId,
    validate,
    uploadRestaurantImage.single('logo'),
    updateRestaurantLogo
);
router.put('/:id/status', validations.mongoId, validate, toggleRestaurantStatus);

module.exports = router;
