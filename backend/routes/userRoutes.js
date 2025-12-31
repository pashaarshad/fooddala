const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    updateAvatar,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    getFavorites,
    addToFavorites,
    removeFromFavorites,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');
const { uploadAvatar } = require('../config/cloudinary');

// All routes require authentication
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validations.updateProfile, validate, updateProfile);
router.put('/avatar', uploadAvatar.single('avatar'), updateAvatar);
router.put('/password', changePassword);

// Address routes
router.post('/addresses', validations.address, validate, addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

// Favorites routes
router.get('/favorites', getFavorites);
router.post('/favorites/:id', addToFavorites);
router.delete('/favorites/:id', removeFromFavorites);

module.exports = router;
