const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken, verifyToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User with this email already exists',
        });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        phone,
        verificationToken,
        verificationTokenExpires,
    });

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
            user: user.toPublicJSON(),
            accessToken,
            refreshToken,
        },
    });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    // Check if user has password (might be Google-only account)
    if (!user.password) {
        return res.status(401).json({
            success: false,
            message: 'Please login with Google',
        });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
        });
    }

    // Check if active
    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Your account has been deactivated. Please contact support.',
        });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: user.toPublicJSON(),
            accessToken,
            refreshToken,
        },
    });
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleCallback = asyncHandler(async (req, res) => {
    const user = req.user;

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification token',
        });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'Email verified successfully',
    });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal if user exists
        return res.json({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.',
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
    });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            message: 'Invalid or expired reset token',
        });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
        success: true,
        message: 'Password reset successful. Please login with your new password.',
    });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Refresh token is required',
        });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
        });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
        });
    }

    // Generate new access token
    const accessToken = generateToken(user._id);

    res.json({
        success: true,
        data: { accessToken },
    });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
    // Clear refresh token
    req.user.refreshToken = undefined;
    await req.user.save();

    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
    res.json({
        success: true,
        data: { user: req.user.toPublicJSON() },
    });
});

// @desc    Login with Firebase Google
// @route   POST /api/auth/google-firebase
// @access  Public
exports.googleFirebaseLogin = asyncHandler(async (req, res) => {
    const { email, name, googleId, photoUrl } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required',
        });
    }

    let user = await User.findOne({ email });

    if (user) {
        // Update googleId if not present
        if (!user.googleId) {
            user.googleId = googleId;
        }
        // Update avatar if not present
        if (!user.avatar && photoUrl) {
            user.avatar = photoUrl;
        }
    } else {
        // Create new user
        // Note: password is required by schema validation if not handled carefully, 
        // but typically for social auth we might set a dummy one or make it optional in schema. 
        // In User.js, password is not marked required: true, but minlength is set.
        // Mongoose validators usually run on required fields. Let's check schema again.
        // Looking at User.js: password field has minlength but NOT required: true.
        // So we can skip it.

        user = await User.create({
            name: name || email.split('@')[0],
            email,
            googleId,
            avatar: photoUrl,
            isVerified: true,
        });
    }

    // Generate tokens
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        success: true,
        message: 'Google login successful',
        data: {
            user: user.toPublicJSON(),
            accessToken,
            refreshToken,
        },
    });
});
