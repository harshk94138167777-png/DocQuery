const nodemailer = require('nodemailer');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const wrap = (title, body) => `<div style="font-family:'Inter',-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;"><h1 style="font-size:24px;color:#1a1a2e;margin-bottom:16px;">${title}</h1>${body}</div>`;
const btn = (url, text) => `<a href="${url}" style="display:inline-block;background:#6C5CE7;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;margin:24px 0;font-weight:600;">${text}</a>`;

class EmailService {
  static async sendVerificationEmail(email, token) {
    try {
      await transporter.sendMail({
        from: `"DocQ" <${env.FROM_EMAIL}>`, to: email, subject: 'Verify your DocQ account',
        html: wrap('Welcome to DocQ', `<p style="color:#555;line-height:1.6;">Click below to verify your email.</p>${btn(`${env.CLIENT_URL}/verify-email?token=${token}`, 'Verify Email')}<p style="color:#888;font-size:14px;">Expires in 24 hours.</p>`),
      });
      logger.info({ to: email }, 'Verification email sent');
    } catch (error) { logger.error({ error, to: email }, 'Failed to send verification email'); }
  }

  static async sendPasswordResetEmail(email, token) {
    try {
      await transporter.sendMail({
        from: `"DocQ" <${env.FROM_EMAIL}>`, to: email, subject: 'Reset your DocQ password',
        html: wrap('Password Reset', `<p style="color:#555;line-height:1.6;">Click below to set a new password.</p>${btn(`${env.CLIENT_URL}/reset-password?token=${token}`, 'Reset Password')}<p style="color:#888;font-size:14px;">Expires in 30 minutes.</p>`),
      });
    } catch (error) { logger.error({ error, to: email }, 'Failed to send reset email'); }
  }

  static async sendCollectionInviteEmail(email, inviterName, collectionName) {
    try {
      await transporter.sendMail({
        from: `"DocQ" <${env.FROM_EMAIL}>`, to: email, subject: `${inviterName} invited you to "${collectionName}" on DocQ`,
        html: wrap("You've been invited!", `<p style="color:#555;line-height:1.6;"><strong>${inviterName}</strong> invited you to <strong>"${collectionName}"</strong>.</p>${btn(`${env.CLIENT_URL}/login`, 'Open DocQ')}`),
      });
    } catch (error) { logger.error({ error, to: email }, 'Failed to send invite email'); }
  }
}

module.exports = { EmailService };
