const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Cloudinary storage engine for multer ──────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cookmyshow/events',      // folder inside your Cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }], // resize on upload
  },
});

// Max file size: 5 MB per image.  Accept up to 5 images per request.
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

module.exports = upload;
