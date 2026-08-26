const crypto = require('crypto');

const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateSessionId = () => crypto.randomBytes(32).toString('hex');

module.exports = { generateToken, hashToken, generateSessionId };
