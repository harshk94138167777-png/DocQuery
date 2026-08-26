const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { MIME_TO_FILE_TYPE, LIMITS } = require('@docq/shared');
const { storageConfig, ensureUploadDir } = require('../config/storage');

ensureUploadDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, storageConfig.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = Object.keys(MIME_TO_FILE_TYPE);

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, DOCX, TXT, CSV, MD`);
    error.statusCode = 400;
    cb(error);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: LIMITS.MAX_FILE_SIZE_BYTES, files: 10 } });

module.exports = { upload };
