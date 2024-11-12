'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./src/utils/logger');
const requestLogger = require('./src/utils/requestLogger');
const mysqlDatabase = require('./src/config/mysql'); // Import MySQLDatabase instance

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.startServer();
  }

  async initializeDatabase() {
    try {
      // Test the database connection
      await mysqlDatabase.query('SELECT 1');
      logger.info('Database connected successfully.');
    } catch (error) {
      logger.error('Database connection failed:', error.message);
      process.exit(1); // Exit if the database connection fails
    }
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
    // Define your routes here
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
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM signal received. Closing HTTP server.');
  await mysqlDatabase.closeConnection(); // Close database connection pool
  process.exit(0);
});

module.exports = new Server();
