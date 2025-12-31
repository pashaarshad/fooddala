const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in rupees
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes
 * @returns {object} Razorpay order object
 */
const createOrder = async (amount, currency = 'INR', notes = {}) => {
    try {
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: `receipt_${Date.now()}`,
            notes,
        };

        const order = await razorpay.orders.create(options);
        return {
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
            },
        };
    } catch (error) {
        console.error('Razorpay create order error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether signature is valid
 */
const verifyPayment = (orderId, paymentId, signature) => {
    try {
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    } catch (error) {
        console.error('Razorpay verify error:', error);
        return false;
    }
};

/**
 * Fetch payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {object} Payment details
 */
const fetchPayment = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return {
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount / 100,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                email: payment.email,
                contact: payment.contact,
                createdAt: new Date(payment.created_at * 1000),
            },
        };
    } catch (error) {
        console.error('Razorpay fetch payment error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Initiate refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (optional, full refund if not provided)
 * @returns {object} Refund details
 */
const initiateRefund = async (paymentId, amount = null) => {
    try {
        const options = {};
        if (amount) {
            options.amount = Math.round(amount * 100); // Convert to paise
        }

        const refund = await razorpay.payments.refund(paymentId, options);
        return {
            success: true,
            refund: {
                id: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                createdAt: new Date(refund.created_at * 1000),
            },
        };
    } catch (error) {
        console.error('Razorpay refund error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Get Razorpay public key for frontend
 * @returns {string} Razorpay key ID
 */
const getPublicKey = () => {
    return process.env.RAZORPAY_KEY_ID;
};

module.exports = {
    razorpay,
    createOrder,
    verifyPayment,
    fetchPayment,
    initiateRefund,
    getPublicKey,
};
