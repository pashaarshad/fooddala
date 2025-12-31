const axios = require('axios');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Store OTPs in memory temporarily (In production, use Redis or Database)
const otpStore = new Map();

// Helper to clean up expired OTPs
const cleanupOTP = (phone) => {
    setTimeout(() => {
        otpStore.delete(phone);
    }, 5 * 60 * 1000); // 5 minutes expiration
};

exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.length !== 10) {
            return res.status(400).json({ message: 'Invalid phone number' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP
        otpStore.set(phone, otp);
        cleanupOTP(phone);

        // Send via Fast2SMS (Using Query Params as per documentation)
        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
                route: 'otp',
                variables_values: otp,
                flash: '0',
                numbers: phone
            }
        });

        if (response.data.return) {
            console.log('Fast2SMS Success:', response.data);
            res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            console.error('Fast2SMS Error:', response.data);
            res.status(500).json({ message: 'Fast2SMS Error: ' + (response.data.message || 'Unknown error') });
        }

    } catch (error) {
        console.error('Send OTP Error Details:', error.response?.data || error.message);
        if (!process.env.FAST2SMS_API_KEY) {
            console.error('FAST2SMS_API_KEY is missing in .env!');
        }
        res.status(500).json({ message: 'Server error sending OTP: ' + error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, otp, role = 'customer' } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        // Verify OTP
        const storedOTP = otpStore.get(phone);
        if (!storedOTP || storedOTP !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        otpStore.delete(phone);

        // Find or create user
        let user = await User.findOne({ phone });

        if (!user) {
            // Create new user if not exists
            user = await User.create({
                phone,
                role,
                name: 'User ' + phone.slice(-4), // Default name
                email: `${phone}@fooddala.com` // Placeholder email
            });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Verification failed' });
    }
};
