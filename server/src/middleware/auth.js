const Session = require('../models/Session');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const authenticate = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.session_id;
    if (!sessionId) { sendError(res, 401, 'UNAUTHORIZED', 'Authentication required'); return; }

    const session = await Session.findOne({ sessionId, expiresAt: { $gt: new Date() } });
    if (!session) {
      res.clearCookie('session_id');
      sendError(res, 401, 'SESSION_EXPIRED', 'Session expired. Please log in again.');
      return;
    }

    const user = await User.findOne({ _id: session.userId, deletedAt: null });
    if (!user) { sendError(res, 401, 'USER_NOT_FOUND', 'User account not found'); return; }

    req.user = user.toObject();
    req.sessionId = sessionId;
    next();
  } catch (error) { next(error); }
};

const optionalAuth = async (req, _res, next) => {
  try {
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      const session = await Session.findOne({ sessionId, expiresAt: { $gt: new Date() } });
      if (session) {
        const user = await User.findOne({ _id: session.userId, deletedAt: null });
        if (user) { req.user = user.toObject(); req.sessionId = sessionId; }
      }
    }
    next();
  } catch { next(); }
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user?.emailVerified) {
    sendError(res, 403, 'EMAIL_NOT_VERIFIED', 'Please verify your email address');
    return;
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireEmailVerified };
