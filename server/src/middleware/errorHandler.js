const { ZodError } = require('zod');
const { logger } = require('../utils/logger');
const { sendError } = require('../utils/response');

const errorHandler = (err, _req, res, _next) => {
  logger.error({ err: err.message, stack: err.stack }, 'Unhandled error');

  if (err instanceof ZodError) {
    const details = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(e.message);
    });
    sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
    return;
  }

  if (err.name === 'MulterError') { sendError(res, 400, 'UPLOAD_ERROR', err.message); return; }
  if (err.name === 'CastError') { sendError(res, 400, 'INVALID_ID', 'Invalid resource ID format'); return; }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  sendError(res, statusCode, 'SERVER_ERROR', message);
};

module.exports = { errorHandler };
