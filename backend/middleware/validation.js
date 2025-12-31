const { body, param, query, validationResult } = require('express-validator');

// Handle validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.error('Validation Failed:', JSON.stringify(errors.array(), null, 2)); // Add this logging
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }
    next();
};

// Common validation rules
const validations = {
    // User validations
    register: [
        body('name')
            .trim()
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('phone')
            .optional()
            .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
    ],

    login: [
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Please provide a valid email'),
        body('password')
            .notEmpty().withMessage('Password is required'),
    ],

    updateProfile: [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
        body('phone')
            .optional()
            .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
    ],

    // Address validations
    address: [
        body('street').trim().notEmpty().withMessage('Street address is required'),
        body('city').trim().notEmpty().withMessage('City is required'),
        body('state').trim().notEmpty().withMessage('State is required'),
        body('pincode')
            .trim()
            .notEmpty().withMessage('Pincode is required')
            .matches(/^[0-9]{6}$/).withMessage('Please provide a valid 6-digit pincode'),
        body('label')
            .optional()
            .isIn(['home', 'work', 'other']).withMessage('Label must be home, work, or other'),
    ],

    // Restaurant validations
    createRestaurant: [
        body('name')
            .trim()
            .notEmpty().withMessage('Restaurant name is required')
            .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
        body('phone')
            .notEmpty().withMessage('Phone number is required')
            .matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
        body('address.street').trim().notEmpty().withMessage('Street address is required'),
        body('address.city').trim().notEmpty().withMessage('City is required'),
        body('address.state').trim().notEmpty().withMessage('State is required'),
        body('address.pincode')
            .trim()
            .notEmpty().withMessage('Pincode is required')
            .matches(/^[0-9]{6}$/).withMessage('Please provide a valid 6-digit pincode'),
        body('cuisine')
            .optional()
            .isArray().withMessage('Cuisine must be an array'),
    ],

    // Menu Item validations
    createMenuItem: [
        body('name')
            .trim()
            .notEmpty().withMessage('Item name is required')
            .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
        body('price')
            .notEmpty().withMessage('Price is required')
            .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
        body('category')
            .trim()
            .notEmpty().withMessage('Category is required'),
        body('isVeg')
            .optional()
            .isBoolean().withMessage('isVeg must be a boolean'),
    ],

    // Order validations
    createOrder: [
        body('restaurantId')
            .notEmpty().withMessage('Restaurant ID is required'),
        // .isMongoId().withMessage('Invalid restaurant ID'), // Disabled for demo data
        body('items')
            .isArray({ min: 1 }).withMessage('At least one item is required'),
        body('items.*.menuItemId')
            .notEmpty().withMessage('Menu item ID is required'),
        // .isMongoId().withMessage('Invalid menu item ID'), // Disabled for demo data
        body('items.*.quantity')
            .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('deliveryAddressId')
            .optional(),
        // .isMongoId().withMessage('Invalid address ID'), // Disabled for demo data
        body('paymentMethod')
            .notEmpty().withMessage('Payment method is required')
            .isIn(['cod', 'online', 'wallet']).withMessage('Invalid payment method'),
    ],

    // Review validations
    createReview: [
        body('rating')
            .notEmpty().withMessage('Rating is required')
            .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('comment')
            .optional()
            .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
    ],

    // Common validations
    mongoId: [
        param('id').isMongoId().withMessage('Invalid ID format'),
    ],

    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    ],
};

module.exports = { validate, validations };
