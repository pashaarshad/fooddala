const express = require('express');
const router = express.Router();
const {
    getMenuItems,
    getMenuItem,
    createMenuItem,
    updateMenuItem,
    updateMenuItemImage,
    deleteMenuItem,
    toggleAvailability,
    getCategories,
    bulkUpdateAvailability,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { uploadMenuImage } = require('../config/cloudinary');

// Public routes
router.get('/restaurant/:restaurantId', getMenuItems);
router.get('/categories/:restaurantId', getCategories);
router.get('/:id', validations.mongoId, validate, getMenuItem);

// Protected routes (restaurant owners only)
router.use(protect);
router.use(authorize('restaurant', 'admin'));

router.post('/', uploadMenuImage.single('image'), validations.createMenuItem, validate, createMenuItem);
router.put('/:id', validations.mongoId, validate, updateMenuItem);
router.put('/:id/image', validations.mongoId, validate, uploadMenuImage.single('image'), updateMenuItemImage);
router.delete('/:id', validations.mongoId, validate, deleteMenuItem);
router.put('/:id/availability', validations.mongoId, validate, toggleAvailability);
router.put('/bulk-availability', bulkUpdateAvailability);

module.exports = router;
