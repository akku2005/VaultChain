'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./src/utils/logger');
const requestLogger = require('./src/utils/requestLogger');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.startServer();
  }

  initializeMiddlewares() {
    // Logging middleware
    this.app.use(requestLogger);

    // Security and performance middlewares
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  initializeRoutes() {
    // Add your routes here
    this.app.get('/', (req, res) => {
      res.json({ message: 'DeFi Management Platform API' });
    });
  }

  startServer() {
    const startTime = process.hrtime();

    this.app.listen(this.port, () => {
      logger.info(`Server running on port ${this.port}`);
      logger.custom.performance('Server Startup', startTime);
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received. Closing HTTP server.');
  process.exit(0);
});

module.exports = new Server();
