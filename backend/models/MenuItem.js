const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    options: [{
        name: { type: String, required: true },
        price: { type: Number, default: 0 },
    }],
    required: {
        type: Boolean,
        default: false,
    },
    maxSelections: {
        type: Number,
        default: 1,
    },
});

const menuItemSchema = new mongoose.Schema(
    {
        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            maxlength: [300, 'Description cannot exceed 300 characters'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        discountPrice: {
            type: Number,
            min: [0, 'Discount price cannot be negative'],
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        image: {
            type: String,
            default: '',
        },
        isVeg: {
            type: Boolean,
            default: false,
        },
        isVegan: {
            type: Boolean,
            default: false,
        },
        isGlutenFree: {
            type: Boolean,
            default: false,
        },
        spiceLevel: {
            type: String,
            enum: ['none', 'mild', 'medium', 'hot', 'extra-hot'],
            default: 'none',
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        customizations: [customizationSchema],
        preparationTime: {
            type: Number,
            default: 15, // in minutes
        },
        calories: {
            type: Number,
        },
        tags: [{
            type: String,
            trim: true,
        }],
        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for effective price (considering discount)
menuItemSchema.virtual('effectivePrice').get(function () {
    return this.discountPrice && this.discountPrice < this.price
        ? this.discountPrice
        : this.price;
});

// Virtual for discount percentage
menuItemSchema.virtual('discountPercentage').get(function () {
    if (!this.discountPrice || this.discountPrice >= this.price) return 0;
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
