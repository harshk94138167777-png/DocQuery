const rateLimit = require('express-rate-limit');
const { LIMITS } = require('@docq/shared');

const createLimiter = (config, msg) => rateLimit({
  windowMs: config.windowMs, max: config.max, standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: msg } },
});

const authLimiter = createLimiter(LIMITS.RATE_LIMIT_AUTH, 'Too many attempts. Try again later.');
const apiLimiter = createLimiter(LIMITS.RATE_LIMIT_API, 'Too many requests. Slow down.');
const chatLimiter = createLimiter(LIMITS.RATE_LIMIT_CHAT, 'Too many chat requests. Wait a moment.');
const uploadLimiter = createLimiter(LIMITS.RATE_LIMIT_UPLOAD, 'Too many uploads. Wait.');
const exportLimiter = createLimiter(LIMITS.RATE_LIMIT_EXPORT, 'Too many export requests.');

module.exports = { authLimiter, apiLimiter, chatLimiter, uploadLimiter, exportLimiter };
