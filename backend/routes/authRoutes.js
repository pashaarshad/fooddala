const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
    register,
    login,
    googleCallback,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshToken,
    logout,
    getMe,
} = require('../controllers/authController');
const { sendOTP, verifyOTP } = require('../controllers/otpController');
const { protect } = require('../middleware/auth');
const { validate, validations } = require('../middleware/validation');

// Public routes
router.post('/register', validations.register, validate, register);
router.post('/login', validations.login, validate, login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// OTP Routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
