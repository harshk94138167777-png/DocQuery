const { sendError } = require('../utils/response');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = {};
      result.error.errors.forEach((e) => {
        const path = e.path.join('.') || 'value';
        if (!details[path]) details[path] = [];
        details[path].push(e.message);
      });
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request data', details);
      return;
    }
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
