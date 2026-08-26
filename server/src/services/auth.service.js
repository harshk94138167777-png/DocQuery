const argon2 = require('argon2');
const User = require('../models/User');
const Session = require('../models/Session');
const PasswordResetToken = require('../models/PasswordResetToken');
const { generateSessionId, generateToken, hashToken } = require('../utils/crypto');
const { LIMITS } = require('@docq/shared');

class AuthService {
  static async signup(email, password, displayName) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      const err = new Error('An account with this email already exists'); err.statusCode = 409; throw err;
    }
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 2 });
    const user = await User.create({ email: email.toLowerCase(), passwordHash, displayName, provider: 'local', emailVerified: true });
    return user.toObject();
  }

  static async login(email, password) {
    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+passwordHash +loginAttempts +lockUntil');
    if (!user) { const err = new Error('Invalid email or password'); err.statusCode = 401; throw err; }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const wait = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      const err = new Error(`Account locked. Try again in ${wait} minute(s).`); err.statusCode = 429; throw err;
    }

    if (!user.passwordHash) { const err = new Error('Please use OAuth to log in'); err.statusCode = 401; throw err; }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      const attempts = (user.loginAttempts || 0) + 1;
      const updates = { loginAttempts: attempts };
      if (attempts >= 5) updates.lockUntil = new Date(Date.now() + Math.min(Math.pow(2, attempts - 5) * 60000, 1800000));
      await User.updateOne({ _id: user._id }, { $set: updates });
      const err = new Error('Invalid email or password'); err.statusCode = 401; throw err;
    }

    await User.updateOne({ _id: user._id }, { $set: { loginAttempts: 0, lockUntil: null, lastLoginAt: new Date() } });
    return user.toObject();
  }

  static async createSession(userId, ipAddress, userAgent) {
    const sessionId = generateSessionId();
    await Session.create({ sessionId, userId, ipAddress, userAgent, expiresAt: new Date(Date.now() + LIMITS.SESSION_MAX_AGE_MS) });
    return sessionId;
  }

  static async destroySession(sessionId) { await Session.deleteOne({ sessionId }); }
  static async destroyAllUserSessions(userId) { await Session.deleteMany({ userId }); }

  static async generatePasswordResetToken(email) {
    const user = await User.findOne({ email: email.toLowerCase(), deletedAt: null });
    if (!user) return null;
    const token = generateToken();
    await PasswordResetToken.create({ tokenHash: hashToken(token), userId: user._id, expiresAt: new Date(Date.now() + LIMITS.RESET_TOKEN_TTL_MS) });
    return token;
  }

  static async resetPassword(token, newPassword) {
    const resetToken = await PasswordResetToken.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() }, usedAt: null });
    if (!resetToken) { const err = new Error('Invalid or expired reset token'); err.statusCode = 400; throw err; }
    const passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 2 });
    await User.updateOne({ _id: resetToken.userId }, { $set: { passwordHash } });
    await PasswordResetToken.updateOne({ _id: resetToken._id }, { $set: { usedAt: new Date() } });
    await Session.deleteMany({ userId: resetToken.userId });
  }

  static async generateEmailVerificationToken(userId) {
    const token = generateToken();
    await PasswordResetToken.create({ tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + LIMITS.VERIFICATION_TOKEN_TTL_MS) });
    return token;
  }

  static async verifyEmail(token) {
    const vt = await PasswordResetToken.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() }, usedAt: null });
    if (!vt) { const err = new Error('Invalid or expired verification token'); err.statusCode = 400; throw err; }
    await User.updateOne({ _id: vt.userId }, { $set: { emailVerified: true } });
    await PasswordResetToken.updateOne({ _id: vt._id }, { $set: { usedAt: new Date() } });
  }
}

module.exports = { AuthService };
