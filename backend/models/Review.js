const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        foodRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        deliveryRating: {
            type: Number,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
        images: [{
            type: String,
        }],
        isVerified: {
            type: Boolean,
            default: false,
        },
        reply: {
            text: String,
            repliedAt: Date,
        },
        likes: {
            type: Number,
            default: 0,
        },
        isHidden: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one review per user per order
reviewSchema.index({ user: 1, order: 1 }, { unique: true });
reviewSchema.index({ restaurant: 1, createdAt: -1 });

// Update restaurant rating after review save
reviewSchema.post('save', async function () {
    const Restaurant = mongoose.model('Restaurant');
    const reviews = await this.constructor.find({ restaurant: this.restaurant });

    const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = reviews.length > 0 ? totalRatings / reviews.length : 0;

    await Restaurant.findByIdAndUpdate(this.restaurant, {
        rating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        totalRatings: totalRatings,
    });
});

module.exports = mongoose.model('Review', reviewSchema);
