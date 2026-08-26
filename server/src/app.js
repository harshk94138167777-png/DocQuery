const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const { env } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { getRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');
const { createDocumentProcessorWorker } = require('./workers/documentProcessor.worker');
const routes = require('./routes');
const { logger } = require('./utils/logger');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', routes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    getRedis();
    createDocumentProcessorWorker();

    const port = env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`✅ Server running on port ${port} in ${env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    // Log the full error stack for debugging
    logger.error('❌ Failed to start server:', error);
    console.error(error); // ensures you see the stack trace in terminal
    process.exit(1);
  }
};

startServer();

// Trigger nodemon restart
