const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
    },
    customizations: [{
        name: String,
        option: String,
        price: { type: Number, default: 0 },
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    specialInstructions: String,
});

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            required: true,
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        items: [orderItemSchema],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        deliveryFee: {
            type: Number,
            default: 0,
        },
        packagingFee: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        couponCode: {
            type: String,
        },
        deliveryAddress: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            landmark: String,
            location: {
                type: { type: String, enum: ['Point'], default: 'Point' },
                coordinates: { type: [Number] },
            },
        },
        status: {
            type: String,
            enum: [
                'pending',
                'confirmed',
                'preparing',
                'ready',
                'picked_up',
                'on_the_way',
                'delivered',
                'cancelled',
            ],
            default: 'pending',
        },
        statusHistory: [{
            status: String,
            timestamp: { type: Date, default: Date.now },
            note: String,
        }],
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'online', 'wallet'],
            required: true,
        },
        paymentDetails: {
            razorpayOrderId: String,
            razorpayPaymentId: String,
            razorpaySignature: String,
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        driverLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number] },
        },
        estimatedDeliveryTime: {
            type: Date,
        },
        actualDeliveryTime: {
            type: Date,
        },
        specialInstructions: {
            type: String,
            maxlength: 500,
        },
        cancellationReason: {
            type: String,
        },
        refundAmount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ driver: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

// Generate unique order number
orderSchema.statics.generateOrderNumber = function () {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FD${timestamp}${random}`;
};

// Add status to history
orderSchema.methods.addStatusHistory = function (status, note = '') {
    this.statusHistory.push({ status, note, timestamp: new Date() });
    this.status = status;
};

// Calculate estimated delivery time
orderSchema.methods.calculateEstimatedDelivery = function (prepTime, deliveryTime) {
    const now = new Date();
    const totalMinutes = (prepTime || 20) + (deliveryTime || 30);
    this.estimatedDeliveryTime = new Date(now.getTime() + totalMinutes * 60000);
};

module.exports = mongoose.model('Order', orderSchema);
