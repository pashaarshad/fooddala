const jwt = require('jsonwebtoken');
const passport = require('passport');

// Generate JWT Token
const generateToken = (userId, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
};

// Verify Token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Authentication Middleware - Protect routes
const protect = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: err.message,
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated.',
            });
        }

        req.user = user;
        next();
    })(req, res, next);
};

// Optional Authentication - User may or may not be logged in
const optionalAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (user && user.isActive) {
            req.user = user;
        }
        next();
    })(req, res, next);
};

// Role-based Authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource.`,
            });
        }

        next();
    };
};

// Verify Email Ownership
const verifyEmailOwnership = (req, res, next) => {
    if (!req.user.isVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email address first.',
        });
    }
    next();
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    protect,
    optionalAuth,
    authorize,
    verifyEmailOwnership,
};
