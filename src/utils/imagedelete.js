import { v2 as cloudinary } from 'cloudinary';

// Function to delete file from Cloudinary by public_id
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
            throw new Error('Failed to delete from Cloudinary');
        }
        return result;
    } catch (error) {
        console.error('Error while deleting from Cloudinary:', error.message);
        throw new Error('Cloudinary deletion error');
    }
};

export { deleteFromCloudinary };
