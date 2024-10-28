import multer from 'multer';
import path from 'path';

// Define storage settings
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp'); // Change this to your desired upload directory
    },
    filename: function (req, file, cb) {
        // Preserve the original file name
        cb(null, file.originalname);
    }
});

// File filter for validating the file type
const fileFilter = (req, file, cb) => {
    const filetypes = /mp4|mkv|avi|jpg|jpeg|png/; // Add the file types you want to accept
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: File type not supported!'));
    }
};

// Multer configuration
export const upload = multer({
    storage: storage,
    limits: { fileSize: 100000000 }, // Limit size to 100MB
    fileFilter: fileFilter
});
