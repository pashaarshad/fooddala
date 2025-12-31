const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Restaurant name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        cuisine: [{
            type: String,
            trim: true,
        }],
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            landmark: String,
        },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true }, // [longitude, latitude]
        },
        images: [{
            type: String,
        }],
        logo: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            lowercase: true,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
        totalRatings: {
            type: Number,
            default: 0,
        },
        isOpen: {
            type: Boolean,
            default: true,
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        openingHours: {
            monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
            tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
            wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
            thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
            friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
            saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
            sunday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
        },
        deliveryRadius: {
            type: Number,
            default: 5, // in kilometers
        },
        minimumOrder: {
            type: Number,
            default: 0,
        },
        deliveryFee: {
            type: Number,
            default: 0,
        },
        avgDeliveryTime: {
            type: Number,
            default: 30, // in minutes
        },
        tags: [{
            type: String,
            trim: true,
        }],
        featured: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ name: 'text', cuisine: 'text', tags: 'text' });
restaurantSchema.index({ isApproved: 1, isActive: 1, isOpen: 1 });

// Virtual for menu items
restaurantSchema.virtual('menuItems', {
    ref: 'MenuItem',
    localField: '_id',
    foreignField: 'restaurant',
});

// Calculate average rating
restaurantSchema.methods.calculateRating = function () {
    if (this.totalRatings === 0) {
        this.rating = 0;
    } else {
        this.rating = this.totalRatings / this.totalReviews;
    }
    return this.rating;
};

// Check if restaurant is currently open based on time
restaurantSchema.methods.isCurrentlyOpen = function () {
    if (!this.isOpen) return false;

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const hours = this.openingHours[today];

    if (!hours || hours.isClosed) return false;

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime <= closeTime;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
