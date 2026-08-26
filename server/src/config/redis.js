const Redis = require('ioredis');
const { env } = require('./env');
const { logger } = require('../utils/logger');

let redis = null;

const getRedis = () => {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) { logger.error('Redis connection failed after 3 retries'); return null; }
        return Math.min(times * 200, 2000);
      },
    });
    redis.on('connect', () => logger.info('✅ Redis connected'));
    redis.on('error', (err) => logger.error({ err }, 'Redis error'));
  }
  return redis;
};

const disconnectRedis = async () => {
  if (redis) { await redis.quit(); redis = null; logger.info('Redis disconnected'); }
};

module.exports = { getRedis, disconnectRedis };
