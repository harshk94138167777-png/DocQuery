const { Router } = require('express');
const { AuthService } = require('../services/auth.service');
const { EmailService } = require('../services/email.service');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/audit');
const { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } = require('@docq/shared');
const { sendSuccess } = require('../utils/response');
const { cookieConfig } = require('../config/security');

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    const user = await AuthService.signup(email, password, displayName);
    const verifyToken = await AuthService.generateEmailVerificationToken(user._id);
    await EmailService.sendVerificationEmail(email, verifyToken);
    const sessionId = await AuthService.createSession(user._id, req.ip || 'unknown', req.headers['user-agent'] || '');
    res.cookie('session_id', sessionId, cookieConfig);
    sendSuccess(res, { user, emailVerificationSent: true }, 201);
  } catch (error) { next(error); }
});

router.post('/login', authLimiter, validate(loginSchema), auditLog('login', 'user'), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.login(email, password);
    const sessionId = await AuthService.createSession(user._id, req.ip || 'unknown', req.headers['user-agent'] || '');
    res.cookie('session_id', sessionId, cookieConfig);
    sendSuccess(res, { user });
  } catch (error) { next(error); }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try { if (req.sessionId) await AuthService.destroySession(req.sessionId); res.clearCookie('session_id'); sendSuccess(res, { message: 'Logged out successfully' }); } catch (error) { next(error); }
});

router.get('/me', authenticate, (req, res) => { sendSuccess(res, { user: req.user }); });

router.patch('/me', authenticate, validate(require('@docq/shared').updateProfileSchema), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: req.body },
      { new: true }
    ).select('-passwordHash -loginAttempts -lockUntil');
    sendSuccess(res, { user: updatedUser });
  } catch (error) { next(error); }
});

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try { const token = await AuthService.generatePasswordResetToken(req.body.email); if (token) await EmailService.sendPasswordResetEmail(req.body.email, token); sendSuccess(res, { message: 'If an account exists, a reset email has been sent.' }); } catch (error) { next(error); }
});

router.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res, next) => {
  try { await AuthService.resetPassword(req.body.token, req.body.newPassword); sendSuccess(res, { message: 'Password reset successfully.' }); } catch (error) { next(error); }
});

router.post('/verify-email', validate(verifyEmailSchema), async (req, res, next) => {
  try { await AuthService.verifyEmail(req.body.token); sendSuccess(res, { message: 'Email verified successfully' }); } catch (error) { next(error); }
});

module.exports = router;
