const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for different upload types
const createStorage = (folder) => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `fooddala/${folder}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
        },
    });
};

// Multer upload configurations
const uploadAvatar = multer({
    storage: createStorage('avatars'),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadRestaurantImage = multer({
    storage: createStorage('restaurants'),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadMenuImage = multer({
    storage: createStorage('menu-items'),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
        return true;
    } catch (error) {
        console.error('Error deleting image:', error);
        return false;
    }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    if (!url) return null;
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const folder = parts[parts.length - 2];
    return `fooddala/${folder}/${filename.split('.')[0]}`;
};

module.exports = {
    cloudinary,
    uploadAvatar,
    uploadRestaurantImage,
    uploadMenuImage,
    deleteImage,
    getPublicIdFromUrl,
};
