const helmet = require('helmet');
const cors = require('cors');
const { env } = require('./env');

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", env.CLIENT_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Clean up trailing slashes from both origin and CLIENT_URL to prevent silly mismatches
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanConfigUrl = env.CLIENT_URL.replace(/\/$/, '');
    
    if (cleanOrigin === cleanConfigUrl || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}. Expected: ${cleanConfigUrl}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400,
});

const cookieConfig = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

module.exports = { helmetMiddleware, corsMiddleware, cookieConfig };
