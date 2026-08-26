const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('../utils/logger');

const connectDatabase = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
    mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  } catch (error) {
    logger.error({ error }, '❌ MongoDB connection failed');
    process.exit(1);
  }
};

const disconnectDatabase = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

module.exports = { connectDatabase, disconnectDatabase };
