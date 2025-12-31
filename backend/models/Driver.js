const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        vehicleType: {
            type: String,
            enum: ['bicycle', 'motorcycle', 'car'],
            required: true,
        },
        vehicleNumber: {
            type: String,
            required: true,
        },
        licenseNumber: {
            type: String,
            required: true,
        },
        documents: {
            license: String,
            vehicleRC: String,
            insurance: String,
            photo: String,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        currentLocation: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] },
        },
        currentOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        rating: {
            type: Number,
            default: 5,
            min: 0,
            max: 5,
        },
        totalDeliveries: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
        todayEarnings: {
            type: Number,
            default: 0,
        },
        weeklyEarnings: {
            type: Number,
            default: 0,
        },
        bankDetails: {
            accountNumber: String,
            ifscCode: String,
            accountHolderName: String,
            bankName: String,
        },
        lastLocationUpdate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for geospatial queries
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ isOnline: 1, isAvailable: 1, isVerified: 1 });

// Find nearby available drivers
driverSchema.statics.findNearbyAvailable = function (coordinates, maxDistance = 5000) {
    return this.find({
        isOnline: true,
        isAvailable: true,
        isVerified: true,
        currentLocation: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates,
                },
                $maxDistance: maxDistance, // in meters
            },
        },
    }).populate('user', 'name phone avatar');
};

module.exports = mongoose.model('Driver', driverSchema);
