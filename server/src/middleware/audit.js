const AuditLog = require('../models/AuditLog');

const auditLog = (action, entityType) => {
  return (req, _res, next) => {
    const originalJson = _res.json.bind(_res);
    _res.json = function (body) {
      if (_res.statusCode >= 200 && _res.statusCode < 300 && req.user) {
        const entityId = req.params.id || req.params.collectionId || body?.data?._id;
        AuditLog.create({
          userId: req.user._id, action, entityType,
          entityId: entityId || 'unknown',
          collectionId: req.params.collectionId || req.body?.collectionId || null,
          details: { method: req.method, path: req.path, statusCode: _res.statusCode },
          ipAddress: req.ip || req.socket?.remoteAddress || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = { auditLog };
