const CollectionMember = require('../models/CollectionMember');
const { ROLE_HIERARCHY } = require('@docq/shared');
const { sendError } = require('../utils/response');

const requireCollectionRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const collectionId = req.params.collectionId || req.body.collectionId || req.query.collectionId;
      if (!collectionId) { sendError(res, 400, 'MISSING_COLLECTION', 'Collection ID is required'); return; }
      if (!req.user) { sendError(res, 401, 'UNAUTHORIZED', 'Authentication required'); return; }
      if (req.user.role === 'admin') { req.collectionRole = 'owner'; next(); return; }

      const membership = await CollectionMember.findOne({ collectionId, userId: req.user._id });
      if (!membership) { sendError(res, 403, 'FORBIDDEN', 'You do not have access to this collection'); return; }

      const minRequired = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r] || 0));
      const userLevel = ROLE_HIERARCHY[membership.role] || 0;
      if (userLevel < minRequired) { sendError(res, 403, 'INSUFFICIENT_ROLE', 'Insufficient permissions'); return; }

      req.collectionRole = membership.role;
      next();
    } catch (error) { next(error); }
  };
};

module.exports = { requireCollectionRole };
