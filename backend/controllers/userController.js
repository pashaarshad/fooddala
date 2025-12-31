const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { deleteImage, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('favorites', 'name logo rating');

    res.json({
        success: true,
        data: { user: user.toPublicJSON() },
    });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: user.toPublicJSON() },
    });
});

// @desc    Update avatar
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Please upload an image',
        });
    }

    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary
    if (user.avatar && user.avatar.includes('cloudinary')) {
        const publicId = getPublicIdFromUrl(user.avatar);
        if (publicId) await deleteImage(publicId);
    }

    user.avatar = req.file.path;
    await user.save();

    res.json({
        success: true,
        message: 'Avatar updated successfully',
        data: { avatar: user.avatar },
    });
});

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    if (user.password) {
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }
    }

    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: 'Password changed successfully',
    });
});

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
    const { label, street, city, state, pincode, landmark, location, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    // If this is set as default, unset other defaults
    if (isDefault) {
        user.addresses.forEach((addr) => {
            addr.isDefault = false;
        });
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
        label,
        street,
        city,
        state,
        pincode,
        landmark,
        location: location || { type: 'Point', coordinates: [0, 0] },
        isDefault: makeDefault,
    });

    await user.save();

    res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: { addresses: user.addresses },
    });
});

// @desc    Update address
// @route   PUT /api/users/addresses/:id
// @access  Private
exports.updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { label, street, city, state, pincode, landmark, location, isDefault } = req.body;

    const user = await User.findById(req.user._id);

    const address = user.addresses.id(id);
    if (!address) {
        return res.status(404).json({
            success: false,
            message: 'Address not found',
        });
    }

    // If setting as default, unset others
    if (isDefault) {
        user.addresses.forEach((addr) => {
            addr.isDefault = false;
        });
    }

    if (label) address.label = label;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;
    if (landmark !== undefined) address.landmark = landmark;
    if (location) address.location = location;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    res.json({
        success: true,
        message: 'Address updated successfully',
        data: { addresses: user.addresses },
    });
});

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user._id);

    const address = user.addresses.id(id);
    if (!address) {
        return res.status(404).json({
            success: false,
            message: 'Address not found',
        });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If deleted was default, make another one default
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
        success: true,
        message: 'Address deleted successfully',
        data: { addresses: user.addresses },
    });
});

// @desc    Get favorite restaurants
// @route   GET /api/users/favorites
// @access  Private
exports.getFavorites = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'favorites',
        select: 'name logo images cuisine rating totalReviews avgDeliveryTime deliveryFee isOpen',
    });

    res.json({
        success: true,
        data: { favorites: user.favorites },
    });
});

// @desc    Add to favorites
// @route   POST /api/users/favorites/:id
// @access  Private
exports.addToFavorites = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user._id);

    if (user.favorites.includes(id)) {
        return res.status(400).json({
            success: false,
            message: 'Restaurant already in favorites',
        });
    }

    user.favorites.push(id);
    await user.save();

    res.json({
        success: true,
        message: 'Added to favorites',
    });
});

// @desc    Remove from favorites
// @route   DELETE /api/users/favorites/:id
// @access  Private
exports.removeFromFavorites = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user._id);

    user.favorites = user.favorites.filter((fav) => fav.toString() !== id);
    await user.save();

    res.json({
        success: true,
        message: 'Removed from favorites',
    });
});
