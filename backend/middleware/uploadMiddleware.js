const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadBaseDir = path.resolve(__dirname, '../uploads');
const productUploadDir = path.join(uploadBaseDir, 'products');
const categoryUploadDir = path.join(uploadBaseDir, 'categories');

[uploadBaseDir, productUploadDir, categoryUploadDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isCategory = req.originalUrl.includes('categor');
    cb(null, isCategory ? categoryUploadDir : productUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WEBP, and SVG image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

module.exports = upload;
