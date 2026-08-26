const path = require('path');
const fs = require('fs');
const { env } = require('./env');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const getUploadPath = (filename) => path.join(UPLOAD_DIR, filename);

const deleteFile = async (filePath) => {
  try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch { /* already deleted */ }
};

const storageConfig = {
  uploadDir: UPLOAD_DIR,
  maxFileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  useS3: Boolean(env.S3_BUCKET),
};

module.exports = { ensureUploadDir, getUploadPath, deleteFile, storageConfig };
