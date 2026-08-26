const sendSuccess = (res, data, statusCode = 200, meta) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
};

const sendError = (res, statusCode, code, message, details) => {
  const response = { success: false, error: { code, message } };
  if (details) response.error.details = details;
  res.status(statusCode).json(response);
};

const sendPaginated = (res, data, cursor, hasMore, total) => {
  const meta = { hasMore };
  if (cursor) meta.cursor = cursor;
  if (total !== undefined) meta.total = total;
  res.status(200).json({ success: true, data, meta });
};

module.exports = { sendSuccess, sendError, sendPaginated };
